export type AppUser = {
  id: string
  email: string
  name: string
  role: 'free' | 'pro' | 'admin'
}

export type AppEnv = {
  Variables: {
    user: AppUser
    session: unknown
  }
}
