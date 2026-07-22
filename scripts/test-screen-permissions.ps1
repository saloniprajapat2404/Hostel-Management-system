# Screen permission integration test (local API)
$ErrorActionPreference = 'Stop'
$base = 'http://127.0.0.1:8080'
$branchId = '6a5f81d7d96f58151c54045f' # Vijay Nagar
$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

function Login-User($identifier, $password, $branch = $null) {
  $body = @{ identifier = $identifier; password = $password } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method POST -Body $body -ContentType 'application/json; charset=utf-8'
  $headers = @{ Authorization = "Bearer $($login.token)" }
  if ($branch) { $headers['X-Branch-Id'] = $branch }
  return @{ login = $login; headers = $headers }
}

function Api-Get($path, $headers) {
  try {
    $r = Invoke-WebRequest -Uri "$base$path" -Headers $headers -UseBasicParsing
    return @{ ok = $true; status = $r.StatusCode; body = $r.Content }
  } catch {
    $status = [int]$_.Exception.Response.StatusCode
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    return @{ ok = $false; status = $status; body = $reader.ReadToEnd() }
  }
}

function New-TestUser($headers, $role, $email, $perms) {
  $body = @{
    email = $email
    password = 'demo123'
    fullName = "PermTest $role $ts"
    role = $role
    phone = '9876543210'
    parentPhone = '9876543211'
    aadharNumber = '123456789012'
    addressLine = 'Test Address'
    city = 'Indore'
    state = 'MP'
    pincode = '452001'
    studentId = if ($role -eq 'STUDENT') { "PT$ts$role".Substring(0, [Math]::Min(12, "PT$ts$role".Length)) } else { $null }
    active = $true
    screenPermissions = $perms
    accessGrant = $false
  } | ConvertTo-Json -Depth 5
  return Invoke-RestMethod -Uri "$base/api/users" -Method POST -Body $body -Headers $headers -ContentType 'application/json; charset=utf-8'
}

$admin = Login-User 'superadmin@takshak.edu' 'demo123'
$adminHeaders = $admin.headers
$adminHeaders['X-Branch-Id'] = $branchId

$testCases = @(
  @{
    Role = 'STUDENT'
    Email = "perm-student-$ts@test.edu"
    Perms = @{ FEES = $false; COMPLAINTS = $false; NOTICES = $false }
    ExpectBlocked = @('/api/users/me/fees', '/api/complaints', '/api/notices')
    ExpectAllowed = @('/api/dashboard/stats', '/api/allocations/me')
  },
  @{
    Role = 'ADMIN'
    Email = "perm-admin-$ts@test.edu"
    Perms = @{ FEES = $false; COMPLAINTS = $false; NOTICES = $false }
    ExpectBlocked = @('/api/fees/overview', '/api/complaints', '/api/notices')
    ExpectAllowed = @('/api/dashboard/stats', '/api/rooms')
  },
  @{
    Role = 'WARDEN'
    Email = "perm-warden-$ts@test.edu"
    Perms = @{ COMPLAINTS = $false; NOTICES = $false; HOSTEL = $false }
    ExpectBlocked = @('/api/complaints', '/api/notices', '/api/admissions')
    ExpectAllowed = @('/api/dashboard/stats', '/api/rooms', '/api/attendance')
  }
)

$results = @()

foreach ($tc in $testCases) {
  Write-Host "`n=== Creating $($tc.Role) user ===" -ForegroundColor Cyan
  $created = New-TestUser $adminHeaders $tc.Role $tc.Email $tc.Perms
  $permsReturned = $created.screenPermissions
  Write-Host "Created: $($created.email) id=$($created.id)"
  Write-Host "FEES=$($permsReturned.FEES) COMPLAINTS=$($permsReturned.COMPLAINTS) HOSTEL=$($permsReturned.HOSTEL)"

  $session = Login-User $tc.Email 'demo123' $branchId
  $user = $session.login.user
  $h = $session.headers

  $caseResult = @{
    role = $tc.Role
    email = $tc.Email
    toggles = $tc.Perms
    loginHasPermissions = ($null -ne $user.screenPermissions -and $user.screenPermissions.Count -gt 0)
    loginPerms = $user.screenPermissions
    apiBlocked = @()
    apiAllowed = @()
    apiFailed = @()
  }

  foreach ($path in $tc.ExpectBlocked) {
    $r = Api-Get $path $h
    if ($r.status -eq 403) { $caseResult.apiBlocked += $path }
    else { $caseResult.apiFailed += "$path (got $($r.status))" }
  }
  foreach ($path in $tc.ExpectAllowed) {
    $r = Api-Get $path $h
    if ($r.ok) { $caseResult.apiAllowed += $path }
    else { $caseResult.apiFailed += "$path allowed expected 200 got $($r.status)" }
  }

  $results += $caseResult
}

$results | ConvertTo-Json -Depth 6
