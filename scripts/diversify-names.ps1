$token = (Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}').token
$headers = @{Authorization="Bearer $token"; "Content-Type"="application/json"}
$products = Invoke-RestMethod -Uri "http://localhost:3001/api/products" -Headers $headers

# Colors by clothing type and gender
$colorsByType = @{
    tshirts  = @("белая","чёрная","серая","бежевая","оливковая","синяя","кремовая","угольная","пыльно-розовая","хаки")
    jeans    = @("синие","чёрные","серые","белые","индиго","тёмно-синие","выбеленные","графитовые","светло-серые","тёмно-серые")
    jackets  = @("чёрная","бежевая","хаки","серая","тёмно-синяя","оливковая","кремовая","коричневая","графитовая","бордовая")
    sneakers = @("белые","чёрные","серые","бежевые","кремовые","тёмно-синие","светло-серые","песочные","угольные","молочные")
    sweaters = @("бежевый","серый","кремовый","чёрный","белый","оливковый","пыльно-розовый","угольный","терракотовый","синий")
    hoodies  = @("серое","чёрное","белое","бежевое","тёмно-синее","оливковое","графитовое","кремовое","угольное","пыльно-розовое")
    pants    = @("чёрные","серые","бежевые","хаки","тёмно-синие","кремовые","графитовые","коричневые","оливковые","белые")
    shirts   = @("белая","голубая","полосатая","клетчатая","серая","бежевая","кремовая","синяя","оливковая","тёмно-синяя")
    dresses  = @("чёрное","бежевое","белое","синее","серое","кремовое","пыльно-розовое","терракотовое","оливковое","шоколадное")
    skirts   = @("чёрная","бежевая","белая","серая","синяя","кремовая","терракотовая","оливковая","пыльно-розовая","графитовая")
}

# Short names without adjective (just noun + material/feature)
function Strip-Adjective($name, $type) {
    $parts = $name -split ' ', 2
    if ($parts.Count -lt 2) { return $name }
    $rest = $parts[1]

    # Map type to noun forms (nominative)
    $typeNouns = @{
        tshirts  = @("футболка", "Футболка")
        jeans    = @("джинсы", "Джинсы")
        jackets  = @("куртка", "Куртка")
        sneakers = @("кеды", "Кеды")
        sweaters = @("свитер", "Свитер")
        hoodies  = @("худи", "Худи")
        pants    = @("брюки", "Брюки")
        shirts   = @("рубашка", "Рубашка")
        dresses  = @("платье", "Платье")
        skirts   = @("юбка", "Юбка")
    }
    $nouns = $typeNouns[$type]
    if (-not $nouns) { return $name }

    # rest already starts with the noun — just capitalize it
    $firstWord = ($rest -split ' ')[0]
    if ($firstWord.ToLower() -eq $nouns[0]) {
        # Capitalize first letter of rest
        return $rest.Substring(0,1).ToUpper() + $rest.Substring(1)
    }
    # Otherwise prepend noun
    return "$($nouns[1]) $rest"
}

# Add color to name
function Add-Color($name, $type, $colorIndex) {
    $colors = $colorsByType[$type]
    if (-not $colors) { return $name }
    $color = $colors[$colorIndex % $colors.Count]

    $parts = $name -split ' ', 2
    if ($parts.Count -lt 2) { return $name }
    $adj = $parts[0]
    $rest = $parts[1]

    # Insert color after adjective: "Лёгкий серый свитер из..."
    # Find noun (first word of rest) and insert color before it
    $restParts = $rest -split ' ', 2
    $noun = $restParts[0]
    $tail = if ($restParts.Count -gt 1) { $restParts[1] } else { "" }

    if ($tail) {
        return "$adj $color $noun $tail"
    } else {
        return "$adj $color $noun"
    }
}

# Deterministic but varied assignment based on product id
# id % 3 == 0 -> strip adjective (~33%)
# id % 3 == 1 -> add color (~33%)
# id % 3 == 2 -> keep as is (~33%)

$updated = 0
$errors = 0
$colorCounter = @{}

foreach ($p in $products) {
    $newName = $p.name
    $mode = $p.id % 3

    if ($mode -eq 0) {
        # Strip adjective
        $newName = Strip-Adjective $p.name $p.type
    } elseif ($mode -eq 1) {
        # Add color
        if (-not $colorCounter[$p.type]) { $colorCounter[$p.type] = 0 }
        $newName = Add-Color $p.name $p.type $colorCounter[$p.type]
        $colorCounter[$p.type]++
    }
    # mode 2: keep as is

    if ($newName -ne $p.name) {
        $body = @{
            name        = $newName
            type        = $p.type
            gender      = $p.gender
            price       = $p.price
            old_price   = $p.old_price
            image_url   = $p.image_url
            season      = $p.season
            category_id = $p.category_id
            is_new      = $p.is_new
            sizes       = $p.sizes
            description = $p.description
        } | ConvertTo-Json
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:3001/api/products/$($p.id)" -Method PUT -Headers $headers -Body $body
            Write-Output "[$($p.id)] $($p.name) -> $newName"
            $updated++
        } catch {
            Write-Output "ERROR [$($p.id)]: $_"
            $errors++
        }
    }
}

Write-Output ""
Write-Output "Done. Updated: $updated, Errors: $errors"
