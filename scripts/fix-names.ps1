$token = (Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}').token
$headers = @{Authorization="Bearer $token"; "Content-Type"="application/json"}
$products = Invoke-RestMethod -Uri "http://localhost:3001/api/products" -Headers $headers

# Correct adjective form by noun
# Returns corrected full name or $null if no fix needed
function Fix-Name($name) {
    # Fix kids names with missing spaces (e.g. "брюкис" -> "брюки с")
    $name = $name -replace 'брюкис\b', 'брюки с'
    $name = $name -replace 'брюкиз\b', 'брюки из'
    $name = $name -replace 'джинсыиз\b', 'джинсы из'
    $name = $name -replace 'джинсыс\b', 'джинсы с'
    $name = $name -replace 'кедыс\b', 'кеды с'
    $name = $name -replace 'кедыдля\b', 'кеды для'
    $name = $name -replace 'курткадля\b', 'куртка для'
    $name = $name -replace 'курткас\b', 'куртка с'
    $name = $name -replace 'рубашкаиз\b', 'рубашка из'
    $name = $name -replace 'рубашкас\b', 'рубашка с'
    $name = $name -replace 'рубашкадля\b', 'рубашка для'
    $name = $name -replace 'свитердля\b', 'свитер для'
    $name = $name -replace 'свитериз\b', 'свитер из'
    $name = $name -replace 'худидля\b', 'худи для'
    $name = $name -replace 'худииз\b', 'худи из'
    $name = $name -replace 'футболкаиз\b', 'футболка из'
    $name = $name -replace 'футболкадля\b', 'футболка для'

    # Adjective -> noun agreement corrections
    # брюки, джинсы, кеды -> plural form
    $pluralNouns = @('брюки', 'джинсы', 'кеды')
    $pluralMap = @{
        'Актуальная'    = 'Актуальные'
        'Активная'      = 'Активные'
        'Архивная'      = 'Архивные'
        'Базовая'       = 'Базовые'
        'Весёлая'       = 'Весёлые'
        'Воздушная'     = 'Воздушные'
        'Городская'     = 'Городские'
        'Графичная'     = 'Графичные'
        'Изящная'       = 'Изящные'
        'Классическая'  = 'Классические'
        'Комфортная'    = 'Комфортные'
        'Лаконичная'    = 'Лаконичные'
        'Лёгкая'        = 'Лёгкие'
        'Мягкая'        = 'Мягкие'
        'Объёмная'      = 'Объёмные'
        'Плотная'       = 'Плотные'
        'Повседневная'  = 'Повседневные'
        'Практичная'    = 'Практичные'
        'Премиальная'   = 'Премиальные'
        'Свободная'     = 'Свободные'
        'Современная'   = 'Современные'
        'Струящаяся'    = 'Струящиеся'
        'Текстурная'    = 'Текстурные'
        'Удобная'       = 'Удобные'
        'Утеплённая'    = 'Утеплённые'
        'Чистая'        = 'Чистые'
        'Элегантная'    = 'Элегантные'
        'Яркая'         = 'Яркие'
    }

    # свитер -> masculine
    $mascMap = @{
        'Актуальная'    = 'Актуальный'
        'Архивная'      = 'Архивный'
        'Базовая'       = 'Базовый'
        'Весёлая'       = 'Весёлый'
        'Воздушная'     = 'Воздушный'
        'Городская'     = 'Городской'
        'Графичная'     = 'Графичный'
        'Изящная'       = 'Изящный'
        'Классическая'  = 'Классический'
        'Комфортная'    = 'Комфортный'
        'Лаконичная'    = 'Лаконичный'
        'Лёгкая'        = 'Лёгкий'
        'Мягкая'        = 'Мягкий'
        'Объёмная'      = 'Объёмный'
        'Плотная'       = 'Плотный'
        'Повседневная'  = 'Повседневный'
        'Практичная'    = 'Практичный'
        'Премиальная'   = 'Премиальный'
        'Свободная'     = 'Свободный'
        'Современная'   = 'Современный'
        'Струящаяся'    = 'Струящийся'
        'Текстурная'    = 'Текстурный'
        'Удобная'       = 'Удобный'
        'Утеплённая'    = 'Утеплённый'
        'Чистая'        = 'Чистый'
        'Элегантная'    = 'Элегантный'
        'Яркая'         = 'Яркий'
    }

    # платье, худи -> neuter
    $neutMap = @{
        'Актуальная'    = 'Актуальное'
        'Архивная'      = 'Архивное'
        'Базовая'       = 'Базовое'
        'Весёлая'       = 'Весёлое'
        'Воздушная'     = 'Воздушное'
        'Городская'     = 'Городское'
        'Графичная'     = 'Графичное'
        'Изящная'       = 'Изящное'
        'Классическая'  = 'Классическое'
        'Комфортная'    = 'Комфортное'
        'Лаконичная'    = 'Лаконичное'
        'Лёгкая'        = 'Лёгкое'
        'Мягкая'        = 'Мягкое'
        'Объёмная'      = 'Объёмное'
        'Плотная'       = 'Плотное'
        'Повседневная'  = 'Повседневное'
        'Практичная'    = 'Практичное'
        'Премиальная'   = 'Премиальное'
        'Свободная'     = 'Свободное'
        'Современная'   = 'Современное'
        'Струящаяся'    = 'Струящееся'
        'Текстурная'    = 'Текстурное'
        'Удобная'       = 'Удобное'
        'Утеплённая'    = 'Утеплённое'
        'Чистая'        = 'Чистое'
        'Элегантная'    = 'Элегантное'
        'Яркая'         = 'Яркое'
    }

    # Extract first word (adjective)
    $parts = $name -split ' ', 2
    if ($parts.Count -lt 2) { return $name }
    $adj = $parts[0]
    $rest = $parts[1]

    # Determine noun (second word)
    $secondWord = ($rest -split ' ')[0].ToLower()

    if ($pluralNouns -contains $secondWord) {
        if ($pluralMap.ContainsKey($adj)) {
            return "$($pluralMap[$adj]) $rest"
        }
    } elseif ($secondWord -eq 'свитер') {
        if ($mascMap.ContainsKey($adj)) {
            return "$($mascMap[$adj]) $rest"
        }
    } elseif ($secondWord -eq 'платье' -or $secondWord -eq 'худи') {
        if ($neutMap.ContainsKey($adj)) {
            return "$($neutMap[$adj]) $rest"
        }
    }

    return $name
}

$updated = 0
$errors = 0

foreach ($p in $products) {
    $fixed = Fix-Name $p.name
    if ($fixed -ne $p.name) {
        $body = @{
            name        = $fixed
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
            Write-Output "[$($p.id)] '$($p.name)' -> '$fixed'"
            $updated++
        } catch {
            Write-Output "ERROR [$($p.id)]: $_"
            $errors++
        }
    }
}

Write-Output ""
Write-Output "Done. Updated: $updated, Errors: $errors"
