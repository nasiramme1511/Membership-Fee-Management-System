const groq = require('../../config/groq');
const AIActionExecutor = require('../aiActionExecutor');

const ACTION_AGENT_PROMPTS = {
  ADD_MEMBER: 'You are adding a new member. Summarize what was created.',
  EDIT_MEMBER: 'You are updating an existing member. Summarize the changes made.',
  DELETE_MEMBER: 'You have deleted a member. Confirm the deletion.',
  VIEW_MEMBER: 'Display the member profile information.',
  SEARCH_MEMBER: 'You searched for members. Present the results.',
  TRANSFER_MEMBER: 'You transferred a member between sectors. Confirm the transfer.',
  ACTIVATE_MEMBER: 'You activated a member. Confirm the status change.',
  DEACTIVATE_MEMBER: 'You deactivated a member. Confirm the status change.',
  DETECT_DUPLICATE_MEMBERS: 'You scanned for duplicate members. Present findings.',
  GENERATE_MEMBER_REPORT: 'You generated a member report. Summarize the report.',
  RECORD_PAYMENT: 'You recorded a payment. Provide receipt information.',
  APPROVE_PAYMENT: 'You approved a payment. Confirm the approval.',
  REJECT_PAYMENT: 'You rejected a payment. Confirm the rejection.',
  UPDATE_PAYMENT: 'You updated a payment. Summarize changes.',
  DELETE_PAYMENT: 'You deleted a payment. Confirm deletion.',
  DETECT_SUSPICIOUS_TRANSACTIONS: 'You detected suspicious transactions. Present findings.',
  CALCULATE_ARREARS: 'You calculated arrears. Present results.',
  CALCULATE_MONTHLY_DUES: 'You calculated monthly dues. Present results.',
  CREATE_USER: 'You created a new user account. Provide credentials.',
  EDIT_USER: 'You updated a user. Summarize changes.',
  DELETE_USER: 'You deleted a user. Confirm deletion.',
  RESET_PASSWORD: 'You reset a password. Provide new credentials.',
  LOCK_ACCOUNT: 'You locked an account. Confirm the action.',
  UNLOCK_ACCOUNT: 'You unlocked an account. Confirm the action.',
  ASSIGN_ROLE: 'You assigned a role. Confirm the assignment.',
  CREATE_SECTOR: 'You created a new sector. Confirm creation.',
  UPDATE_SECTOR: 'You updated a sector. Summarize changes.',
  DELETE_SECTOR: 'You deleted a sector. Confirm deletion.',
  MERGE_SECTORS: 'You merged sectors. Confirm the merge.',
  GENERATE_SECTOR_ANALYTICS: 'You generated sector analytics. Present findings.',
  GENERATE_REPORT: 'You generated a report. Summarize the report data.',
  EXPORT_REPORT: 'You exported data. Confirm the export.',
  APPROVE_ALL_PENDING: 'You approved all pending items. Confirm count.',
  DELETE_INACTIVE_RECORDS: 'You deleted inactive records. Confirm count.',
  SEND_REMINDERS: 'You sent reminders to unpaid members. Confirm count.'
};

const SAFETY_WARNINGS = {
  DELETE_MEMBER: '⚠️ Member deletion cannot be undone. All associated payments and receipts will also be deleted.',
  DELETE_PAYMENT: '⚠️ Payment deletion cannot be undone. The associated receipt will also be voided.',
  DELETE_USER: '⚠️ User account deletion cannot be undone.',
  RESET_PASSWORD: '🔑 Password reset will immediately invalidate the current password.',
  ASSIGN_ROLE: '🔐 Role changes affect system access. Verify the user should have this role.',
  DELETE_SECTOR: '⚠️ Sector deletion is only allowed if no members are assigned to it.',
  MERGE_SECTORS: '⚠️ Merging sectors will move all members from source to target sector.',
  BULK_DELETE_MEMBERS: '⚠️ This will permanently delete multiple members and their records.',
  BULK_DELETE_PAYMENTS: '⚠️ This will permanently delete multiple payment records.',
  DELETE_ALL_MEMBERS: '🚨 DANGER: This will delete ALL members in the system!',
  DELETE_ALL_PAYMENTS: '🚨 DANGER: This will delete ALL payment records!',
  DELETE_ALL_USERS: '🚨 DANGER: This will delete ALL user accounts!',
  APPROVE_ALL_PENDING: '⚠️ This will approve ALL pending payments at once.',
  DELETE_INACTIVE_RECORDS: '⚠️ This will permanently delete inactive records.'
};

class ActionAgent {
  static async process(query, user, context, sseCallback) {
    sseCallback({ event: 'status', data: 'Understanding your request...' });

    const parsed = await AIActionExecutor.parseIntent(query, user);

    if (!parsed.isAction) {
      return this._respondNotAction(parsed.reason || query, user, context, sseCallback);
    }

    const { action, parameters, requiresConfirmation, summary } = parsed;

    sseCallback({ event: 'status', data: `Planning: ${summary}` });

    const hasPermission = AIActionExecutor.checkPermission(action, user);
    if (!hasPermission) {
      return this._respondNoPermission(action, user, context, sseCallback);
    }

    if (requiresConfirmation) {
      const warning = SAFETY_WARNINGS[action] || '';

      const confirmationContext = {
        action,
        parameters,
        summary,
        warning,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          role: user.role
        }
      };

      return this._respondNeedsConfirmation(confirmationContext, query, user, context, sseCallback);
    }

    sseCallback({ event: 'status', data: `Executing: ${action}...` });

    try {
      const result = await AIActionExecutor.execute(action, parameters, user);
      return await this._respondSuccess(action, result, query, user, context, sseCallback);
    } catch (err) {
      return this._respondError(action, err.message, query, user, context, sseCallback);
    }
  }

  static async executeConfirmed(action, parameters, user, sseCallback) {
    sseCallback({ event: 'status', data: `Executing: ${action}...` });

    try {
      const result = await AIActionExecutor.execute(action, parameters, user);
      return await this._respondSuccess(action, result, null, user, null, sseCallback);
    } catch (err) {
      return this._respondError(action, err.message, null, user, null, sseCallback);
    }
  }

  static async _respondSuccess(action, result, query, user, context, sseCallback) {
    const systemPrompt = ACTION_AGENT_PROMPTS[action] || 'You performed an administrative action.';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}

Action: ${action}
Result: ${JSON.stringify(result)}

Write a clear, professional response (1-2 paragraphs) about what was done. Include specific details like names, IDs, counts, and amounts where applicable. Use a helpful and confident tone.

Then provide exactly 2-3 relevant next-step recommendations the user might want to take.

Format:
[SUMMARY]
Your response here.
[RECOMMENDATIONS]
- Recommendation 1
- Recommendation 2`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const fullText = completion.choices[0].message.content.trim();
    let summary = fullText;
    let recommendations = [];

    if (fullText.includes('[RECOMMENDATIONS]')) {
      const parts = fullText.split('[RECOMMENDATIONS]');
      summary = parts[0].replace('[SUMMARY]', '').trim();
      recommendations = parts[1]
        .split('\n')
        .map(line => line.trim().replace(/^-\s*/, ''))
        .filter(line => line.length > 0);
    }

    if (recommendations.length === 0) {
      recommendations = [
        'You can ask me to perform another operation.',
        'I can also generate reports or analytics if needed.'
      ];
    }

    return {
      intent: 'action_completed',
      title: `${action.replace(/_/g, ' ')}`,
      summary,
      action,
      actionResult: result,
      recommendations,
      needsConfirmation: false,
      confirmed: false
    };
  }

  static async _respondNeedsConfirmation(confirmationContext, query, user, context, sseCallback) {
    const warnings = confirmationContext.warning ? `\n\n⚠️ Warning: ${confirmationContext.warning}` : '';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the AI Operations Agent. The user wants to perform an action that requires confirmation.

Action: ${confirmationContext.action}
Summary: ${confirmationContext.summary}
Parameters: ${JSON.stringify(confirmationContext.parameters)}${warnings}

Write a clear confirmation message asking the user to confirm. Explain what will happen, the number of records affected, and any warnings.

Do NOT execute the action. End by asking the user to confirm by saying "yes", "confirm", or "proceed".`
        },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const summary = completion.choices[0].message.content.trim();

    return {
      intent: 'action_confirmation',
      title: `Confirm: ${confirmationContext.action.replace(/_/g, ' ')}`,
      summary,
      action: confirmationContext.action,
      actionParams: confirmationContext.parameters,
      needsConfirmation: true,
      confirmed: false,
      recommendations: [
        'Type "yes", "confirm", or "proceed" to execute.',
        'Type "cancel", "no", or "stop" to cancel.'
      ]
    };
  }

  static async _respondNoPermission(action, user, context, sseCallback) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the AI Operations Agent. A user with role '${user.role}' tried to perform '${action}' which they do not have permission for.

Write a polite response explaining that they don't have the required permissions for this action, what their current role allows, and suggest they contact an administrator if needed.`
        },
        {
          role: 'user',
          content: `I need to perform ${action}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const summary = completion.choices[0].message.content.trim();

    return {
      intent: 'action_denied',
      title: 'Permission Denied',
      summary,
      action,
      needsConfirmation: false,
      confirmed: false,
      recommendations: [
        'Contact an administrator to request additional permissions.',
        'Ask me about what actions your role allows.'
      ]
    };
  }

  static async _respondError(action, errorMsg, query, user, context, sseCallback) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the AI Operations Agent. An error occurred while executing '${action}'.

Error: ${errorMsg}

Write a helpful response explaining what went wrong and how the user might fix it. Be constructive and suggest alternatives.`
        },
        {
          role: 'user',
          content: query || `Execute ${action}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const summary = completion.choices[0].message.content.trim();

    return {
      intent: 'action_error',
      title: `${action.replace(/_/g, ' ')} Failed`,
      summary,
      action,
      error: errorMsg,
      needsConfirmation: false,
      confirmed: false,
      recommendations: [
        'Check that all required information is correct.',
        'Try rephrasing your request with more specific details.'
      ]
    };
  }

  static async _respondNotAction(reason, query, user, context, sseCallback) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `The user said something that does not appear to be an administrative action.

Their request could not be parsed as an action because: ${reason}

Write a brief, helpful response saying that this doesn't seem like an action command. Offer to help with analytics, reports, or action commands instead.`
        },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const summary = completion.choices[0].message.content.trim();

    return {
      intent: 'not_action',
      title: 'How can I help?',
      summary,
      needsConfirmation: false,
      confirmed: false,
      recommendations: [
        'Try "Add member named [name] in [sector]"',
        'Try "Record payment of [amount] for member [id]"',
        'Try "Show me the monthly report"'
      ]
    };
  }
}

module.exports = ActionAgent;
