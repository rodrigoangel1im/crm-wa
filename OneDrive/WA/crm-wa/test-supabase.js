import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lobfcggufnlddpkhrwxi.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvYmZjZ2d1Zm5sZGRwa2hyd3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDk3ODgsImV4cCI6MjA5MzQ4NTc4OH0.a3qv95g-hcos0l4v-KHcnYxiWs2eXEClYIni2C2gDiY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarConexao() {
  console.log('Testando conexão com Supabase...')
  
  // Tentar buscar da tabela 'banco_operacao'
  const { data, error } = await supabase
    .from('banco_operacao')
    .select('*')
    .limit(5)
  
  if (error) {
    console.error('Erro na tabela banco_operacao:', error.message)
    console.log('Tentando tabela propostas...')
    
    const { data: data2, error: error2 } = await supabase
      .from('propostas')
      .select('*')
      .limit(5)
    
    if (error2) {
      console.error('Erro na tabela propostas:', error2.message)
    } else {
      console.log('Dados de propostas:', data2)
    }
  } else {
    console.log('Conexão OK! Dados da tabela banco:', data)
  }
}

testarConexao()
