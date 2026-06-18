import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { setPermissoes } from '../../lib/permissoes'
import './Login.css'

const ROXO = "#3f3b6c";
const ROXO_ESCURO = "#2a2750";
const DOURADO = "#f0c977";
const BRANCO = "#ffffff";

export default function Login({ setPaginaAtual }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [lembrar, setLembrar] = useState(false)
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) throw error
      if (data.user) {
        const { data: usuario } = await supabase
          .from('usuario')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single()
        if (usuario) {
          localStorage.setItem('usuario_id_crmwa', usuario.id)
          localStorage.setItem('usuario_nome_crmwa', usuario.nome || usuario.login || email)
          localStorage.setItem('usuario_admin_crmwa', usuario.admin ? 'true' : 'false')
          localStorage.setItem('usuario_perfil_crmwa', usuario.perfil || '')

          const perfil = usuario.perfil || ''
          const { data: perfilPerms } = await supabase
            .from('perfil_permissao')
            .select('recurso, permissao')
            .eq('perfil', perfil)
          if (perfilPerms) {
            const permMap = {}
            perfilPerms.forEach(p => { permMap[p.recurso] = p.permissao })
            setPermissoes(permMap)
          }
        }
        setPaginaAtual('inicio')
      }
    } catch (err) {
      setErro(err.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Painel esquerdo */}
        <div style={styles.left}>
          {/* Logo */}
          <div style={{ ...styles.logoWrap, textAlign: 'center' }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: DOURADO, textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>Wa Promotora de Crédito</span>
          </div>

          <form onSubmit={handleLogin} style={{ maxWidth: 650, width: "100%", margin: "0 auto" }}>
            {/* Campo Usuário */}
            <div style={styles.fieldWrap}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)", fontSize: 20, pointerEvents: "none" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </span>
                <input
                  style={{ ...styles.input, paddingLeft: 32 }}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = DOURADO)}
                  onBlur={(e) => (e.target.style.borderBottomColor = "rgba(255,255,255,0.35)")}
                  placeholder="Usuário"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div style={styles.fieldWrap}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)", fontSize: 20, pointerEvents: "none" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </span>
                <input
                  style={{ ...styles.input, paddingLeft: 32, paddingRight: 32 }}
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onFocus={(e) => (e.target.style.borderBottomColor = DOURADO)}
                  onBlur={(e) => (e.target.style.borderBottomColor = "rgba(255,255,255,0.35)")}
                  placeholder="Senha"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showSenha ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Opções */}
            <div style={styles.rowOpts}>
              <div style={styles.toggleWrap}>
                <div
                  onClick={() => setLembrar(!lembrar)}
                  style={{ ...styles.toggle, background: lembrar ? DOURADO : "rgba(255,255,255,0.2)" }}
                  role="switch"
                  aria-checked={lembrar}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === " " && setLembrar(!lembrar)}
                >
                  <div style={{ ...styles.toggleKnob, left: lembrar ? 18 : 3 }} />
                </div>
                <span style={styles.toggleLabel}>Lembrar</span>
              </div>
              <button type="button" style={styles.forgotBtn}>Esqueci minha senha</button>
            </div>

            {erro && (
              <div style={{ background: "rgba(198,40,40,0.2)", color: "#f8bbbb", padding: "8px 12px", borderRadius: 8, fontSize: 15, textAlign: "center", marginBottom: 12, border: "1px solid rgba(198,40,40,0.3)" }}>
                {erro}
              </div>
            )}

            {/* Botões */}
            <button
              type="submit"
              style={{ ...styles.btnEntrar, opacity: loading ? 0.8 : 1 }}
              disabled={loading}
            >
              {loading ? "ENTRANDO..." : "ENTRAR"}
            </button>
          </form>
        </div>

        {/* Painel direito */}
        <div style={styles.right}>
          <div style={styles.rightInner}>
            <img src="/logo_transparente.png" alt="WA Promotora" style={{ maxWidth: '80%', height: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxSizing: "border-box",
    background: "#f5f3f7",
  },
  card: {
    display: "flex",
    width: "100%",
    height: "100vh",
  },
  left: {
    background: ROXO,
    padding: "100px 100px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    width: "50%",   
    boxSizing: "border-box",
  },
  logoWrap: { marginBottom: 48 },
  fieldWrap: { marginBottom: 24 },
  label: {
    display: "block",
    fontSize: 18,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 8,
  },
  input: {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(255,255,255,0.35)",
    padding: "2px 0",
    fontSize: 18,
    color: BRANCO,
  },
  eyeBtn: {
    position: "absolute",
    right: 0,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  rowOpts: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "16px 0 28px",
  },
  toggleWrap: { display: "flex", alignItems: "center", gap: 8 },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleKnob: {
    position: "absolute",
    top: 3,
    width: 14,
    height: 14,
    background: BRANCO,
    borderRadius: "50%",
    transition: "left 0.2s",
  },
  toggleLabel: { fontSize: 16, color: "rgba(255,255,255,0.7)" },
  forgotBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    color: "rgba(255,255,255,0.65)",
    textDecoration: "underline",
    padding: 0,
  },
  btnEntrar: {
    width: "100%",
    padding: "10px 0",
    background: DOURADO,
    border: "none",
    borderRadius: 24,
    fontSize: 16,
    fontWeight: 700,
    color: "#1a1a1a",
    cursor: "pointer",
    letterSpacing: "0.5px",
    marginBottom: 16,
    transition: "opacity 0.2s",
  },
  right: {
    width: "50%",
    background: "#e8e4f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  rightInner: { textAlign: "center", padding: 32, display: "flex", alignItems: "center", justifyContent: "center" },
};
