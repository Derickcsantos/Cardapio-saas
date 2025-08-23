import nodemailer from 'nodemailer';

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'devderick98@gmail.com',
    pass: 'ekva olip syxu ggjv'
  }
});

export async function sendInvitationEmail(email, organizationName, inviteLink) {
  try {
    const mailOptions = {
      from: 'devderick98@gmail.com',
      to: email,
      subject: `Convite para se juntar a ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Você foi convidado para se juntar a ${organizationName}</h2>
          <p>Você recebeu um convite para se juntar à organização ${organizationName} no Menu SaaS 3D.</p>
          <p>Clique no botão abaixo para aceitar o convite:</p>
          <div style="margin: 25px 0;">
            <a href="${inviteLink}" 
               style="background-color: #4CAF50; 
                      color: white; 
                      padding: 12px 25px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      font-weight: bold;">
              Aceitar Convite
            </a>
          </div>
          <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p>${inviteLink}</p>
          <p>Atenciosamente,<br>Equipe Menu SaaS 3D</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return { success: false, error: error.message };
  }
}
