/**
 * WhatsApp integration helper.
 * Provides functions to send task reminders to employees using standard templates.
 */

export interface SendWhatsAppParams {
  employeePhone: string;
  employeeName: string;
  taskTitle: string;
  taskDescription?: string | null;
  taskPriority: string;
  taskDueDate?: Date | string | null;
  taskLink: string;
}

export async function sendWhatsAppTaskReminder(params: SendWhatsAppParams) {
  const {
    employeePhone,
    employeeName,
    taskTitle,
    taskDescription,
    taskPriority,
    taskDueDate,
    taskLink,
  } = params;

  // Format the date nicely
  const dueDateStr = taskDueDate
    ? new Date(taskDueDate).toLocaleString()
    : "No due date set";

  // Build the message body using a professional template
  const messageBody = `Hello *${employeeName}*,

You have been assigned a new task: *${taskTitle}*

*Priority:* ${taskPriority}
*Due Date:* ${dueDateStr}

${taskDescription ? `*Description:*\n${taskDescription}\n` : ""}
Please review the details and update your progress here:
${taskLink}

Best regards,
Admin`;

  console.log("==================================================");
  console.log(`[WHATSAPP INTEGRATION] Sending task reminder to: ${employeePhone}`);
  console.log(`[MESSAGE CONTENT]:\n${messageBody}`);
  console.log("==================================================");

  // In a production setup, you would make an API call to Twilio or the WhatsApp Business API:
  /*
  const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/.../Messages.json", {
    method: "POST",
    headers: {
      "Authorization": "Basic " + btoa(process.env.TWILIO_SID + ":" + process.env.TWILIO_AUTH_TOKEN),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      From: "whatsapp:" + process.env.TWILIO_WHATSAPP_NUMBER,
      To: "whatsapp:" + employeePhone,
      Body: messageBody
    })
  });
  const data = await response.json();
  return data;
  */

  return {
    success: true,
    sentTo: employeePhone,
    message: messageBody,
    timestamp: new Date().toISOString(),
  };
}
