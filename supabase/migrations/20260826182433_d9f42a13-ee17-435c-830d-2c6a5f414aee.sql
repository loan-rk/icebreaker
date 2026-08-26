
CREATE TABLE public.questions (
  id int PRIMARY KEY,
  title text NOT NULL,
  prompt text NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read" ON public.questions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.options (
  id text PRIMARY KEY,
  question_id int NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  label text NOT NULL,
  short_label text NOT NULL,
  position int NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.options TO anon, authenticated;
GRANT ALL ON public.options TO service_role;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "options_read" ON public.options FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  color text NOT NULL DEFAULT '#FF7F50',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participants TO anon, authenticated;
GRANT ALL ON public.participants TO service_role;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_all" ON public.participants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  question_id int NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('prediction','vote')),
  option_id text NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participant_id, question_id, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses_all" ON public.responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.game_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phase text NOT NULL DEFAULT 'lobby',
  question_id int NOT NULL DEFAULT 1,
  paused boolean NOT NULL DEFAULT false,
  phase_started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_state TO anon, authenticated;
GRANT ALL ON public.game_state TO service_role;
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_state_all" ON public.game_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.game_state (id) VALUES (1);

INSERT INTO public.questions (id, title, prompt) VALUES
 (1,'Visio cassée','Ta visio plante. Qu''est-ce que tu préfères ?'),
 (2,'Ambiance sonore','Pour bosser, tu choisis quoi ?'),
 (3,'Style de travail','Ta journée idéale commence quand ?'),
 (4,'Notifications Slack','Tes notifications Slack, c''est plutôt ?'),
 (5,'Fonctionnalité à sauver','Tu ne peux en garder qu''une. Laquelle ?'),
 (6,'Style perso','Ta boisson signature ?');

INSERT INTO public.options (id, question_id, emoji, label, short_label, position) VALUES
 ('q1a',1,'🔇','Perdre le son','Sans son',0),
 ('q1b',1,'📵','Perdre l''image','Sans image',1),
 ('q2a',2,'🎵','Musique en fond permanent','Musique',0),
 ('q2b',2,'🤫','Silence total pour se concentrer','Silence',1),
 ('q3a',3,'🌅','Commencer dès 8h et finir tôt','Lève-tôt',0),
 ('q3b',3,'🦉','Commencer dès 10h et finir tard','Couche-tard',1),
 ('q4a',4,'🔔','Activées en permanence','Notifs ON',0),
 ('q4b',4,'🔕','Tout en silencieux','Notifs OFF',1),
 ('q5a',5,'📅','La planification','Planif',0),
 ('q5b',5,'📻','Le direct','Direct',1),
 ('q6a',6,'☕','Café','Café',0),
 ('q6b',6,'🍵','Thé','Thé',1),
 ('q6c',6,'🍺','Bière','Bière',2);

ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
ALTER TABLE public.participants REPLICA IDENTITY FULL;
ALTER TABLE public.responses REPLICA IDENTITY FULL;
ALTER TABLE public.game_state REPLICA IDENTITY FULL;
