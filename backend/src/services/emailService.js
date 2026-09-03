import nodemailer from "nodemailer";

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null;
  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
  return transporter;
}

/**
 * Envia um e-mail transacional. Sem credenciais SMTP configuradas em KEYS.env
 * (EMAIL_HOST/EMAIL_USER/EMAIL_PASS), a mensagem só é registrada no console —
 * o site continua funcionando normalmente, sem e-mails reais saindo.
 */
export async function sendEmail({ to, subject, html }) {
  const client = getTransporter();
  if (!client) {
    console.log(`[email simulado] Para: ${to} | Assunto: ${subject}`);
    return { simulated: true };
  }
  try {
    await client.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    return { simulated: false };
  } catch (err) {
    console.error("Falha ao enviar e-mail:", err.message);
    return { simulated: true, error: err.message };
  }
}

export function welcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: "Bem-vindo(a) ao match.IA",
    html: `<p>Olá, ${user.name}!</p><p>Sua conta de ${user.role === "architect" ? "arquiteto" : "cliente"} no match.IA foi criada com sucesso. ${user.role === "client" ? "Complete seu perfil e rode seu primeiro match com IA." : "Complete seu portfólio para aparecer nos resultados de match."}</p>`,
  });
}

export function cauVerifiedEmail(architect) {
  return sendEmail({
    to: architect.email,
    subject: "Seu registro CAU/A foi verificado no match.IA",
    html: `<p>Olá, ${architect.name}!</p><p>Seu registro profissional foi verificado pela equipe match.IA. O selo "✓ Verificado" já está ativo no seu perfil público, aumentando a confiança dos clientes que encontrarem você pelo match.</p>`,
  });
}

export function validationClosedEmail(recipient, otherParty) {
  return sendEmail({
    to: recipient.email,
    subject: "Resumo do projeto confirmado por ambas as partes — match.IA",
    html: `<p>Olá, ${recipient.name}!</p><p>Você e ${otherParty.name} confirmaram o resumo do projeto no match.IA. Agora vocês têm um registro alinhado do que foi combinado — bom momento para avançar com os próximos passos pelo chat da plataforma.</p>`,
  });
}

export function newReviewEmail(architect, clientName, rating, comment) {
  return sendEmail({
    to: architect.email,
    subject: `Você recebeu uma nova avaliação no match.IA`,
    html: `<p>Olá, ${architect.name}!</p><p>${clientName} avaliou seu atendimento com ${rating} de 5 estrelas${comment ? `:</p><blockquote>${comment}</blockquote>` : "."}<p>Veja no seu perfil público ou no painel.</p>`,
  });
}

export function newMessageEmail(recipient, senderName, text) {
  return sendEmail({
    to: recipient.email,
    subject: `Nova mensagem de ${senderName} no match.IA`,
    html: `<p>${senderName} te enviou uma mensagem no match.IA:</p><blockquote>${text}</blockquote><p>Entre no seu painel para responder.</p>`,
  });
}
