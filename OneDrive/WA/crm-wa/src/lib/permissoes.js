const PERMISSOES_KEY = 'usuario_permissoes_crmwa'

export function getPermissoes() {
  try {
    return JSON.parse(localStorage.getItem(PERMISSOES_KEY)) || {}
  } catch {
    return {}
  }
}

export function setPermissoes(permMap) {
  localStorage.setItem(PERMISSOES_KEY, JSON.stringify(permMap))
}

export function canAccess(recurso) {
  const p = getPermissoes()
  return p[recurso] === 'visualizar' || p[recurso] === 'gerenciar'
}

export function canManage(recurso) {
  const p = getPermissoes()
  return p[recurso] === 'gerenciar'
}
