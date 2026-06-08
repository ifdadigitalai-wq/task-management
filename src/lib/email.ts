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

export interface SendWelcomeEmailParams {
  employeeEmail: string;
  employeeName: string;
  tempPassword: string;
  loginLink: string;
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams) {
  const { employeeEmail, employeeName, tempPassword, loginLink } = params;

  const emailSubject = `Welcome to TaskCenter!`;
  const emailBody = `Dear ${employeeName},

Welcome to TaskCenter! Your account has been created successfully.

Here are your login details:
User ID / Email: ${employeeEmail}
Temporary Password: ${tempPassword}

Please log in using the link below and reset your password on your first sign-in:
${loginLink}

Best regards,
TaskCenter Team`;

  console.log("==================================================");
  console.log(`[EMAIL INTEGRATION] Sending welcome email to: ${employeeEmail}`);
  console.log(`[SUBJECT]: ${emailSubject}`);
  console.log(`[BODY]:\n${emailBody}`);
  console.log("==================================================");

  return {
    success: true,
    sentTo: employeeEmail,
    subject: emailSubject,
    timestamp: new Date().toISOString(),
  };
}

