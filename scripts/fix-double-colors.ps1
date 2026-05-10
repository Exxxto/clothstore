$token = (Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}').token
$headers = @{Authorization="Bearer $token"; "Content-Type"="application/json"}
$products = Invoke-RestMethod -Uri "http://localhost:3001/api/products" -Headers $headers

$colors = @("белая","чёрная","серая","бежевая","оливковая","синяя","кремовая","угольная","пыльно-розовая","хаки",
            "синие","чёрные","серые","белые","индиго","тёмно-синие","выбеленные","графитовые","светло-серые","тёмно-серые",
            "чёрная","бежевая","хаки","серая","тёмно-синяя","оливковая","кремовая","коричневая","графитовая","бордовая",
            "белые","чёрные","серые","бежевые","кремовые","тёмно-синие","светло-серые","песочные","угольные","молочные",
            "бежевый","серый","кремовый","чёрный","белый","оливковый","пыльно-розовый","угольный","терракотовый","синий",
            "серое","чёрное","белое","бежевое","тёмно-синее","оливковое","графитовое","кремовое","угольное","пыльно-розовое",
            "чёрные","серые","бежевые","хаки","тёмно-синие","кремовые","графитовые","коричневые","оливковые","белые",
            "белая","голубая","полосатая","клетчатая","серая","бежевая","кремовая","синяя","оливковая","тёмно-синяя",
            "чёрное","бежевое","белое","синее","серое","кремовое","пыльно-розовое","терракотовое","оливковое","шоколадное",
            "чёрная","бежевая","белая","серая","синяя","кремовая","терракотовая","оливковая","пыльно-розовая","графитовая",
            "тёмно-серые","тёмно-синяя","тёмно-синие","тёмно-синее","тёмно-синий","светло-серые","пыльно-розовое","пыльно-розовый","пыльно-розовая")

$updated = 0

foreach ($p in $products) {
    $words = $p.name -split ' '
    if ($words.Count -lt 3) { continue }

    # Check if word[1] and word[2] are the same (double color/word)
    if ($words[1] -eq $words[2]) {
        # Remove the duplicate: keep words[0], skip words[1], keep words[2..]
        $newName = ($words[0], ($words[2..($words.Count-1)] -join ' ')) -join ' '

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

        $null = Invoke-RestMethod -Uri "http://localhost:3001/api/products/$($p.id)" -Method PUT -Headers $headers -Body $body
        Write-Output "[$($p.id)] Fixed: '$($p.name)' -> '$newName'"
        $updated++
    }
}

Write-Output ""
Write-Output "Fixed: $updated"
