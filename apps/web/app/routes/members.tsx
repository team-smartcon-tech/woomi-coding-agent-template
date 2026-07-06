import { Link } from "react-router"
import { UserPlus } from "lucide-react"
import { Badge } from "~/shared/ui/badge"
import { Button } from "~/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/ui/card"
import { PageHeader } from "~/shared/ui/page-header"
import { Table, TBody, TD, TH, THead, TR } from "~/shared/ui/table"

type MemberRole = "admin" | "manager" | "member"
type MemberStatus = "active" | "invited" | "suspended"

interface Member {
  id: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
}

const members: Member[] = [
  { id: "MBR-01", name: "김우미", email: "woomi@example.com", role: "admin", status: "active" },
  { id: "MBR-02", name: "이도현", email: "dohyun@example.com", role: "manager", status: "active" },
  { id: "MBR-03", name: "박서준", email: "seojun@example.com", role: "member", status: "invited" },
  { id: "MBR-04", name: "최유나", email: "yuna@example.com", role: "member", status: "active" },
  { id: "MBR-05", name: "정민재", email: "minjae@example.com", role: "manager", status: "suspended" },
  { id: "MBR-06", name: "한지우", email: "jiwoo@example.com", role: "member", status: "invited" },
]

const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "관리자",
  manager: "매니저",
  member: "구성원",
}

const ROLE_TONE: Record<MemberRole, "primary" | "info" | "neutral"> = {
  admin: "primary",
  manager: "info",
  member: "neutral",
}

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "활성",
  invited: "초대됨",
  suspended: "정지",
}

const STATUS_TONE: Record<MemberStatus, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
}

export default function MembersRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="구성원"
        description="팀 구성원과 권한을 관리합니다."
        actions={
          <Button>
            <UserPlus aria-hidden />
            구성원 초대
          </Button>
        }
      />

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>이름</TH>
              <TH>이메일</TH>
              <TH>역할</TH>
              <TH>상태</TH>
              <TH className="text-right">관리</TH>
            </TR>
          </THead>
          <TBody>
            {members.map((member) => (
              <TR key={member.id}>
                <TD className="font-medium">{member.name}</TD>
                <TD className="text-muted-foreground">{member.email}</TD>
                <TD>
                  <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABEL[member.role]}</Badge>
                </TD>
                <TD>
                  <Badge tone={STATUS_TONE[member.status]}>{STATUS_LABEL[member.status]}</Badge>
                </TD>
                <TD className="text-right">
                  <Button variant="ghost" size="sm">
                    관리
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>권한 화면 미리보기</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            권한이 없는 사용자에게는 이 화면 대신 접근 거부 화면을 보여주세요.
          </p>
          <Link to="/forbidden">
            <Button variant="outline" size="sm">
              접근 거부 화면 보기
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
