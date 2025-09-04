-- Add French translations for existing services
UPDATE public.services 
SET 
  title_fr = CASE 
    WHEN title = 'TREMGroup' THEN 'TREMGroup'
    WHEN title = 'Chime' THEN 'Chime'
    WHEN title = 'LenderHomePage' THEN 'PageAccueilPrêteur'
    WHEN title = 'Inside Real Estate' THEN 'Immobilier Intérieur'
    WHEN title = 'Real Estate Webmasters' THEN 'Maîtres Web Immobilier'
    WHEN title = 'BoldLeads' THEN 'ProspectsCourages'
    WHEN title = 'Top Producer' THEN 'Producteur Principal'
    WHEN title = 'Wise Agent' THEN 'Agent Sage'
    WHEN title = 'Follow Up Boss' THEN 'Chef de Suivi'
    WHEN title = 'CINC' THEN 'CINC'
    ELSE title
  END,
  description_fr = CASE 
    WHEN title = 'TREMGroup' THEN 'Transformez votre présence en ligne avec les sites web IDX de TREMGroup - solutions organisées qui génèrent des prospects et augmentent les conversions sans effort.'
    WHEN title = 'Chime' THEN 'Révolutionnez votre communication client avec Chime - la plateforme de messagerie intelligente qui maintient l''engagement des prospects.'
    WHEN title = 'LenderHomePage' THEN 'Créez des pages de destination puissantes pour les prêteurs avec LenderHomePage - optimisées pour la génération de prospects hypothécaires.'
    WHEN title = 'Inside Real Estate' THEN 'Accédez à la formation et aux ressources immobilières de premier plan avec Inside Real Estate - votre parcours vers l''excellence.'
    WHEN title = 'Real Estate Webmasters' THEN 'Propulsez votre marketing immobilier avec Real Estate Webmasters - sites web, CRM et outils de génération de prospects tout-en-un.'
    WHEN title = 'BoldLeads' THEN 'Générez plus de prospects qualifiés avec BoldLeads - publicités Facebook et pages de destination optimisées pour l''immobilier.'
    WHEN title = 'Top Producer' THEN 'Maîtrisez votre entreprise immobilière avec Top Producer - CRM et outils de gestion de contacts de confiance depuis des décennies.'
    WHEN title = 'Wise Agent' THEN 'Simplifiez votre flux de travail immobilier avec Wise Agent - CRM abordable avec automatisation et suivi des transactions.'
    WHEN title = 'Follow Up Boss' THEN 'Ne perdez jamais un prospect avec Follow Up Boss - CRM immobilier simple qui vous garde organisé et productif.'
    WHEN title = 'CINC' THEN 'Alimentez votre croissance avec CINC - génération de prospects immobiliers et outils CRM utilisés par les meilleures équipes.'
    ELSE description
  END
WHERE title IN ('TREMGroup', 'Chime', 'LenderHomePage', 'Inside Real Estate', 'Real Estate Webmasters', 'BoldLeads', 'Top Producer', 'Wise Agent', 'Follow Up Boss', 'CINC');