$files = Get-ChildItem -Path 'c:\Users\Tuinuane_CEO\Desktop\dhwarsh-hr-frontend\src' -Recurse -Include '*.tsx','*.ts'
$hrefs = [System.Collections.Generic.HashSet[string]]::new()
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $ms = [regex]::Matches($content, 'href=[\"'']([^\"''\n\r`]+)[\"'']')
    foreach ($m in $ms) {
        $v = $m.Groups[1].Value
        if ($v -match '^/' -and $v -notmatch '\$\{') { [void]$hrefs.Add($v) }
    }
}
$hrefs | Sort-Object
