-- Create language learning tables

-- Languages table
CREATE TABLE IF NOT EXISTS languages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  flag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proficiency levels table
CREATE TABLE IF NOT EXISTS proficiency_levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  example TEXT,
  difficulty TEXT NOT NULL REFERENCES proficiency_levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grammar sections table
CREATE TABLE IF NOT EXISTS grammar_sections (
  id SERIAL PRIMARY KEY,
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL REFERENCES proficiency_levels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grammar exercises table
CREATE TABLE IF NOT EXISTS grammar_exercises (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES grammar_sections(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_language_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  language_id TEXT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL REFERENCES proficiency_levels(id) ON DELETE CASCADE,
  vocabulary_progress INTEGER DEFAULT 0,
  grammar_progress INTEGER DEFAULT 0,
  pronunciation_progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, language_id)
);

-- Insert default languages
INSERT INTO languages (id, name, flag) VALUES
  ('en', 'English', '🇬🇧'),
  ('es', 'Spanish', '🇪🇸'),
  ('pt', 'Portuguese', '🇵🇹'),
  ('de', 'German', '🇩🇪'),
  ('fr', 'French', '🇫🇷'),
  ('ja', 'Japanese', '🇯🇵'),
  ('ru', 'Russian', '🇷🇺'),
  ('hi', 'Hindi', '🇮🇳'),
  ('ko', 'Korean', '🇰🇷'),
  ('zh', 'Chinese', '🇨🇳')
ON CONFLICT (id) DO NOTHING;

-- Insert proficiency levels
INSERT INTO proficiency_levels (id, name) VALUES
  ('beginner', 'Beginner'),
  ('intermediate', 'Intermediate'),
  ('advanced', 'Advanced')
ON CONFLICT (id) DO NOTHING;

-- Insert sample vocabulary for English
INSERT INTO vocabulary (language_id, word, translation, example, difficulty) VALUES
  ('en', 'Hello', 'Hello', 'Hello, how are you?', 'beginner'),
  ('en', 'Goodbye', 'Goodbye', 'Goodbye, see you tomorrow!', 'beginner'),
  ('en', 'Thank you', 'Thank you', 'Thank you for your help.', 'beginner'),
  ('en', 'Please', 'Please', 'Please pass me the salt.', 'beginner'),
  ('en', 'Yes', 'Yes', 'Yes, I understand.', 'beginner'),
  ('en', 'No', 'No', 'No, I don''t think so.', 'beginner'),
  ('en', 'Water', 'Water', 'Can I have a glass of water?', 'beginner'),
  ('en', 'Food', 'Food', 'The food was delicious.', 'beginner'),
  ('en', 'Time', 'Time', 'What time is it?', 'beginner'),
  ('en', 'Day', 'Day', 'Have a great day!', 'beginner')
ON CONFLICT DO NOTHING;

-- Insert sample vocabulary for Spanish
INSERT INTO vocabulary (language_id, word, translation, example, difficulty) VALUES
  ('es', 'Hola', 'Hello', '¡Hola! ¿Cómo estás?', 'beginner'),
  ('es', 'Adiós', 'Goodbye', 'Adiós, ¡hasta mañana!', 'beginner'),
  ('es', 'Gracias', 'Thank you', 'Gracias por tu ayuda.', 'beginner'),
  ('es', 'Por favor', 'Please', 'Por favor, pásame la sal.', 'beginner'),
  ('es', 'Sí', 'Yes', 'Sí, entiendo.', 'beginner'),
  ('es', 'No', 'No', 'No, no lo creo.', 'beginner'),
  ('es', 'Agua', 'Water', '¿Me das un vaso de agua?', 'beginner'),
  ('es', 'Comida', 'Food', 'La comida estaba deliciosa.', 'beginner'),
  ('es', 'Tiempo', 'Time', '¿Qué hora es?', 'beginner'),
  ('es', 'Día', 'Day', '¡Que tengas un buen día!', 'beginner')
ON CONFLICT DO NOTHING;

-- Insert sample grammar sections for English
INSERT INTO grammar_sections (language_id, title, description, difficulty) VALUES
  ('en', 'Present Simple', 'Learn how to use the present simple tense', 'beginner'),
  ('en', 'Past Simple', 'Learn how to use the past simple tense', 'beginner')
ON CONFLICT DO NOTHING;

-- Insert sample grammar exercises for English
INSERT INTO grammar_exercises (section_id, question, options, correct) VALUES
  (1, 'Complete the sentence: She ___ to school every day.', '["go", "goes", "going", "went"]', 1),
  (1, 'Complete the sentence: They ___ English very well.', '["speak", "speaks", "speaking", "spoke"]', 0),
  (2, 'Complete the sentence: I ___ to the cinema yesterday.', '["go", "goes", "going", "went"]', 3),
  (2, 'Complete the sentence: She ___ her homework last night.', '["do", "does", "doing", "did"]', 3)
ON CONFLICT DO NOTHING;

-- Insert sample grammar sections for Spanish
INSERT INTO grammar_sections (language_id, title, description, difficulty) VALUES
  ('es', 'Presente Simple', 'Aprende a usar el presente simple', 'beginner'),
  ('es', 'Pretérito Indefinido', 'Aprende a usar el pretérito indefinido', 'beginner')
ON CONFLICT DO NOTHING;

-- Insert sample grammar exercises for Spanish
INSERT INTO grammar_exercises (section_id, question, options, correct) VALUES
  (3, 'Completa la frase: Ella ___ a la escuela todos los días.', '["va", "vas", "vamos", "van"]', 0),
  (3, 'Completa la frase: Ellos ___ inglés muy bien.', '["hablan", "habla", "hablamos", "habláis"]', 0),
  (4, 'Completa la frase: Yo ___ al cine ayer.', '["fui", "fuiste", "fue", "fuimos"]', 0),
  (4, 'Completa la frase: Ella ___ sus deberes anoche.', '["hizo", "hiciste", "hicimos", "hicisteis"]', 0)
ON CONFLICT DO NOTHING; 