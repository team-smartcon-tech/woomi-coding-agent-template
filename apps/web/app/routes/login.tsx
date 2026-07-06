import { Boxes } from "lucide-react"
import { LoginForm } from "~/features/auth/ui/login-form"
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card"

export default function LoginRoute() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Boxes className="size-5" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Woomi Admin</h1>
          <p className="text-sm text-muted-foreground">관리자 콘솔에 로그인</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
