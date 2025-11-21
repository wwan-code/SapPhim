# Simplified conversion script

# File paths
$inputFile = "docs/CHUONG_2_UPDATED.md"
$outputFile = "docs/BAO_CAO_GIUA_KI_CNPM_CONVERTED.docx"

# Check for pandoc
pandoc --version >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pandoc is not installed. Please install it to continue." -ForegroundColor Red
    exit 1
}

# Check for input file
if (-not (Test-Path $inputFile)) {
    Write-Host "Input file not found: $inputFile" -ForegroundColor Red
    exit 1
}

# Execute conversion
pandoc $inputFile `
    -o $outputFile `
    --toc `
    --toc-depth=3 `
    --number-sections `
    --highlight-style=tango `
    -V lang=vi `
    -V papersize=a4 `
    -V geometry:margin=2.5cm `
    -V fontsize=13pt `
    -V mainfont="Times New Roman"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Conversion successful: $outputFile" -ForegroundColor Green
} else {
    Write-Host "Conversion failed." -ForegroundColor Red
    exit 1
}
