# 0012 · Check-ins y valoraciones: un voto por usuario, recálculo transaccional

**Estado:** Aceptada

## Contexto

UC4 / RF7 piden registrar visitas y valorar cada café en tres dimensiones (1-5). La búsqueda ordena por `averageRating` y las tarjetas muestran la media y el número de valoraciones, así que esas cifras deben ser baratas de leer y no se pueden inflar.

## Decisión

- **Un check-in por usuario, café y día**, con el día en la zona horaria del café (`check_ins."visitedOn"`, índice único `(userId, cafeId, visitedOn)`). Lo garantiza la base de datos, también ante dobles pulsaciones. Sin geofencing.
- **Un voto por usuario:** la media usa el check-in más reciente de cada usuario; la puntuación de un check-in es la media de sus tres dimensiones. `totalReviews` = usuarios distintos, `totalCheckIns` = todas las visitas.
- **Agregados guardados en `cafes` y recalculados en la misma transacción** que crea, edita o borra un check-in (`recomputeCafeRatings`), también al borrar una cuenta. Se bloquea la fila del café con `FOR NO KEY UPDATE`: `FOR UPDATE` choca con el `FOR KEY SHARE` que toma la clave foránea al insertar y dos check-ins simultáneos se interbloquearían. Después se invalida la caché de búsqueda.
- **Medias por dimensión al leer** la ficha: solo se usan ahí.
- **Precio pagado privado:** los listados públicos no incluyen `pricePaid`.

## Alternativas descartadas

- **Trigger de Postgres:** cubre todas las escrituras sin código, pero esconde la lógica en una migración y es más difícil de probar.
- **Calcular al leer:** obligaría a una subconsulta en cada búsqueda geoespacial y complicaría la caché.

## Consecuencias

- Toda escritura nueva sobre `check_ins` (p. ej. el check-in offline de UC8) debe pasar por `recomputeCafeRatings`.
- El seed genera check-ins ficticios para que las medias sean coherentes.
