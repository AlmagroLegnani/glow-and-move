const prisma = require('../lib/prisma');

async function submitContact(req, res) {
  const { name, email, whatsapp, documentId, nationality, reason, comments } = req.body;

  if (!name || !email || !comments) {
    return res.status(400).json({ error: 'Nombre, email y comentarios son requeridos' });
  }

  const message = await prisma.contactMessage.create({
    data: { name, email, whatsapp, documentId, nationality, reason, comments },
  });

  res.status(201).json({ ok: true, id: message.id });
}

module.exports = { submitContact };
