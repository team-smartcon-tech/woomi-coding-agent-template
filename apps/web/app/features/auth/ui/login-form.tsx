import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router"
import { loginSchema, type LoginInput } from "~/features/auth/model/login.schema"
import { Button } from "~/shared/ui/button"
import { Field } from "~/shared/ui/field"
import { Input } from "~/shared/ui/input"

export function LoginForm() {
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginInput) {
    setPending(true)
    setFormError(null)

    // 데모 처리: 실제 인증은 백엔드 API 호출로 교체한다.
    if (values.email === "error@demo.dev") {
      setFormError("이메일 또는 비밀번호가 올바르지 않습니다.")
      setPending(false)
      return
    }

    await new Promise((r) => setTimeout(r, 700))
    navigate("/")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {formError ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</div>
      ) : null}

      <Field label="이메일" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>

      <Field label="비밀번호" htmlFor="password" required error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
      </Field>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </Button>

      <p className="text-xs text-muted-foreground">
        스캐폴드용 임시 로그인입니다. 실제 인증은 features/auth와 백엔드 API로 교체하세요. (오류 화면을 보려면
        이메일에 error@demo.dev 입력)
      </p>
    </form>
  )
}
