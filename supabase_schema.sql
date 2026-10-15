-- Execute este arquivo no SQL Editor do Supabase
-- Dashboard > SQL Editor > New Query > colar tudo aqui e executar

-- Listas de compras
CREATE TABLE shopping_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens de uma lista
CREATE TABLE list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'sem_secao',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'found', 'not_found')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens frequentes (presets para toggle rápido)
CREATE TABLE preset_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'sem_secao',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_list_items_list_id ON list_items(list_id);
CREATE INDEX idx_shopping_lists_status ON shopping_lists(status);

-- Desabilitar Row Level Security (app privado sem autenticação)
ALTER TABLE shopping_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE preset_items DISABLE ROW LEVEL SECURITY;

-- Itens frequentes pré-carregados (você pode editar à vontade)
INSERT INTO preset_items (name, section) VALUES
  ('leite', 'c10'),
  ('leite condensado', 'c10'),
  ('creme de leite', 'c10'),
  ('café', 'c10'),
  ('sal', 'c08'),
  ('azeite', 'c08'),
  ('óleo', 'c08'),
  ('macarrão', 'c09'),
  ('tapioca', 'c09'),
  ('arroz', 'sem_secao'),
  ('feijão', 'sem_secao'),
  ('açúcar', 'sem_secao'),
  ('papel higiênico', 'c04'),
  ('saco de lixo', 'c04'),
  ('detergente', 'c07'),
  ('desinfetante', 'c06'),
  ('sabão roupa', 'c06'),
  ('sabão louça', 'c07'),
  ('chocolate', 'c11'),
  ('biscoito', 'c11'),
  ('granulado', 'c10'),
  ('banana', 'hortifruti'),
  ('maçã', 'hortifruti'),
  ('batata', 'hortifruti'),
  ('cebola', 'hortifruti'),
  ('alho', 'hortifruti'),
  ('limão', 'hortifruti'),
  ('frango', 'acougue'),
  ('carne', 'acougue'),
  ('pão', 'ilha_queijos'),
  ('mussarela', 'ilha_queijos'),
  ('requeijão', 'geladeiras'),
  ('manteiga', 'geladeiras'),
  ('ovos', 'ilha_queijos');
