import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import Input from './ui/Input'
import Button from './ui/Button'
import Checkbox from './ui/Checkbox'
import { login, saveSession, validateIdentifier } from '../utils/auth'
import { t } from '../utils/translations'
import HostelLogo from './HostelLogo'

export default function LoginForm({ lang, hostelName, onError, onSuccessToast }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: { identifier: '', password: '', remember: false },
  })

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 450)
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await login({
        identifier: data.identifier,
        password: data.password,
      })
      saveSession({ token: result.token, user: result.user }, data.remember)
      setSuccess(true)
      onSuccessToast(t(lang, 'success'))
      setTimeout(() => navigate('/app'), 800)
    } catch (err) {
      triggerShake()
      onError(err.message || t(lang, 'invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`animate-fade-in-up w-full max-w-[420px] rounded-3xl border border-white/60 bg-white/80 p-7 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-200 md:p-9 dark:border-slate-700/50 dark:bg-slate-900/80 dark:shadow-none ${shake ? 'animate-shake' : ''}`}
    >
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <HostelLogo size="lg" className="shadow-lg shadow-primary/25" alt={hostelName} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t(lang, 'welcome')}
        </h2>
        <p className="mt-1 text-sm font-semibold text-primary dark:text-primary-light">
          {hostelName}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t(lang, 'subtitle', { hostelName })}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label={t(lang, 'identifier')}
          required
          autoComplete="username"
          error={errors.identifier?.message}
          {...register('identifier', {
            required: t(lang, 'identifierRequired'),
            validate: (value) =>
              validateIdentifier(value) || t(lang, 'identifierInvalid'),
          })}
        />

        <Input
          label={t(lang, 'password')}
          required
          showToggle
          autoComplete="current-password"
          toggleLabels={{
            show: t(lang, 'showPassword'),
            hide: t(lang, 'hidePassword'),
          }}
          error={errors.password?.message}
          {...register('password', {
            required: t(lang, 'passwordRequired'),
            minLength: { value: 6, message: t(lang, 'passwordMin') },
          })}
        />

        <div className="flex items-center justify-between gap-4 pt-1">
          <Checkbox
            id="remember"
            label={t(lang, 'rememberMe')}
            {...register('remember')}
          />
          <a
            href="#forgot"
            className="text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-dark focus:outline-none focus-visible:underline dark:text-primary-light"
            onClick={(e) => e.preventDefault()}
          >
            {t(lang, 'forgotPassword')}
          </a>
        </div>

        <Button
          type="submit"
          loading={loading}
          success={success}
          disabled={success}
          className="mt-2 shadow-md shadow-primary/20"
        >
          {loading ? t(lang, 'signingIn') : success ? t(lang, 'success') : t(lang, 'signIn')}
        </Button>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          {t(lang, 'roleHint')}
        </p>

        <p className="text-center pt-1">
          <a
            href="#help"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors duration-200 hover:text-primary focus:outline-none focus-visible:underline dark:text-slate-400 dark:hover:text-primary-light"
            onClick={(e) => e.preventDefault()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {t(lang, 'needHelp')}
          </a>
        </p>
      </form>
    </div>
  )
}
