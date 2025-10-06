# PowerShell script to fix all @/ imports to relative paths
Write-Host "Fixing all @/ imports to relative paths..."

# Get all TypeScript/JavaScript files with @/ imports
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | Where-Object { (Get-Content $_.FullName -Raw) -match "@/" }

Write-Host "Found $($files.Count) files with @/ imports"

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content $file.FullName -Raw
    
    # Calculate relative path from current file to src
    $relativePath = ""
    $depth = ($file.DirectoryName -split "\\").Count - ($PWD.Path -split "\\").Count - 1
    
    for ($i = 0; $i -lt $depth; $i++) {
        $relativePath += "../"
    }
    
    # Replace @/ with relative path
    $newContent = $content -replace "@/", $relativePath
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "All @/ imports have been converted to relative paths!"