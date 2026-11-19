-- Source registry. Automated sources start disabled until someone records a terms review.
insert into sources (key, display_name, access_mode, enabled, notes) values
  ('linkedin',      'LinkedIn',     'curator_only', true,
   'User Agreement 8.2 bans bots and unauthorized automated access. Curator inbox only.'),
  ('kariyer_net',   'Kariyer.net',  'curator_only', true,
   'No public read API or feed found (Nov 2026). Curator only until a partner feed is agreed.'),
  ('yenibiris',     'YeniBirİş',    'curator_only', true,
   'Terms forbid copying/reproducing site data without permission. Curator only until a feed is agreed.'),
  ('indeed',        'Indeed',       'curator_only', true,
   'Public job-search (Publisher) API retired; remaining APIs are for posting. Curator only.'),
  ('careerjet',     'Careerjet',    'api',          false,
   'Partner API v4. Requires end-user user_ip/user_agent: confirm with Careerjet that a weekly server-side pull and storage are allowed, confirm tr_TR locale, then set terms_reviewed_at and enable.'),
  ('ats',           'Company ATS',  'ats_public',   false,
   'Greenhouse / Lever / Ashby public job-board APIs, per organization that consents (organizations.ats_token). Set terms_reviewed_at to enable.'),
  ('employer_feed', 'Employer feed','partner_feed', false,
   'Opt-in JSON feed or schema.org JobPosting careers page (organizations.feed_url + feed_consent_at).'),
  ('native',        'Agre Jobs',    'disabled',     true,
   'Jobs posted by employers on Agre Jobs; not ingested.');
