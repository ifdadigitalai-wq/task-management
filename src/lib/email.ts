/**
 * Email integration helper.
 * Provides functions to send task reminders to employees.
 */

export interface SendEmailParams {
  employeeEmail: string;
  employeeName: string;
  taskTitle: string;
  taskDescription?: string | null;
  taskPriority: string;
  taskDueDate?: Date | string | null;
  taskLink: string;
}

export async function sendEmailTaskReminder(params: SendEmailParams) {
  const {
    employeeEmail,
    employeeName,
    taskTitle,
    taskDescription,
    taskPriority,
    taskDueDate,
    taskLink,
  } = params;

  const dueDateStr = taskDueDate
    ? new Date(taskDueDate).toLocaleString()
    : "No due date set";

  const emailSubject = `New Task Assigned: ${taskTitle}`;
  const emailBody = `Dear ${employeeName},

You have been assigned a new task: "${taskTitle}".

Priority: ${taskPriority}
Due Date: ${dueDateStr}

${taskDescription ? `Description:\n${taskDescription}\n` : ""}
You can access and manage this task directly inside TaskCenter by clicking the link below:
${taskLink}

Best regards,
TaskCenter Administrator`;

  console.log("==================================================");
  console.log(`[EMAIL INTEGRATION] Sending task email notification to: ${employeeEmail}`);
  console.log(`[SUBJECT]: ${emailSubject}`);
  console.log(`[BODY]:\n${emailBody}`);
  console.log("==================================================");

  // In a production setup, you would use a service like Nodemailer, Resend, SendGrid, etc.
  /*
  const nodemailer = require("nodemailer");
  let transporter = nodemailer.createTransport({...});
  await transporter.sendMail({
    from: '"TaskCenter" <noreply@taskcenter.com>',
    to: employeeEmail,
    subject: emailSubject,
    text: emailBody
  });
  */

  return {
    success: true,
    sentTo: employeeEmail,
    subject: emailSubject,
    timestamp: new Date().toISOString(),
  };
}
