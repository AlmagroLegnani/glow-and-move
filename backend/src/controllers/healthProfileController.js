const prisma = require('../lib/prisma');

async function submitHealthProfile(req, res) {
  const {
    hasChronicIllness,
    chronicIllnessDetail,
    hasDailyMedication,
    dailyMedicationDetail,
    conditionsNotes,
    acceptedTerms,
  } = req.body;

  if (!acceptedTerms) {
    return res.status(400).json({ error: 'Debés aceptar los términos y condiciones' });
  }

  const profile = await prisma.healthProfile.upsert({
    where: { userId: req.userId },
    update: {
      hasChronicIllness: !!hasChronicIllness,
      chronicIllnessDetail,
      hasDailyMedication: !!hasDailyMedication,
      dailyMedicationDetail,
      conditionsNotes,
      acceptedTerms: true,
      acceptedAt: new Date(),
    },
    create: {
      userId: req.userId,
      hasChronicIllness: !!hasChronicIllness,
      chronicIllnessDetail,
      hasDailyMedication: !!hasDailyMedication,
      dailyMedicationDetail,
      conditionsNotes,
      acceptedTerms: true,
      acceptedAt: new Date(),
    },
  });

  res.json(profile);
}

module.exports = { submitHealthProfile };
