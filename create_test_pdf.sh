#!/bin/bash

# Script para crear un PDF de prueba con información de cursos

cat << 'EOF' > /tmp/courses_test.html
<!DOCTYPE html>
<html>
<head>
    <title>Plan de Estudios - Ciencia de la Computación</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #003366; text-align: center; }
        h2 { color: #004488; margin-top: 30px; }
        h3 { color: #0066AA; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
    </style>
</head>
<body>
    <h1>UNIVERSIDAD NACIONAL DE SAN AGUSTÍN DE AREQUIPA</h1>
    <h1>ESCUELA PROFESIONAL DE CIENCIA DE LA COMPUTACIÓN</h1>
    <h1>PLAN DE ESTUDIOS 2025</h1>

    <h2>PRIMER AÑO</h2>
    
    <h3>PRIMER SEMESTRE</h3>
    <table>
        <tr>
            <th>Código</th>
            <th>Nombre del Curso</th>
            <th>Dpto</th>
            <th>Créditos</th>
            <th>Prerrequisitos</th>
            <th>HT</th>
            <th>HS</th>
            <th>HP</th>
            <th>HL</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>2501101</td>
            <td>FUNDAMENTOS DE LA MATEMÁTICA</td>
            <td>MS</td>
            <td>2</td>
            <td>-</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>4.0</td>
        </tr>
        <tr>
            <td>2501103</td>
            <td>INTRODUCCIÓN A LA CIENCIA DE LA COMPUTACIÓN</td>
            <td>SI</td>
            <td>4</td>
            <td>-</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>0.0</td>
            <td>4.0</td>
            <td>6.0</td>
        </tr>
        <tr>
            <td>2501104</td>
            <td>METODOLOGÍA DEL TRABAJO INTELECTUAL</td>
            <td>HU</td>
            <td>2</td>
            <td>-</td>
            <td>1.0</td>
            <td>0.0</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>3.0</td>
        </tr>
    </table>

    <h3>SEGUNDO SEMESTRE</h3>
    <table>
        <tr>
            <th>Código</th>
            <th>Nombre del Curso</th>
            <th>Dpto</th>
            <th>Créditos</th>
            <th>Prerrequisitos</th>
            <th>HT</th>
            <th>HS</th>
            <th>HP</th>
            <th>HL</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>2501208</td>
            <td>PROGRAMACIÓN I</td>
            <td>SI</td>
            <td>5</td>
            <td>2501103</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>2.0</td>
            <td>4.0</td>
            <td>8.0</td>
        </tr>
        <tr>
            <td>2501209</td>
            <td>CÁLCULO DIFERENCIAL</td>
            <td>MS</td>
            <td>4</td>
            <td>2501101</td>
            <td>3.0</td>
            <td>0.0</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>5.0</td>
        </tr>
    </table>

    <h2>SEGUNDO AÑO</h2>
    
    <h3>PRIMER SEMESTRE</h3>
    <table>
        <tr>
            <th>Código</th>
            <th>Nombre del Curso</th>
            <th>Dpto</th>
            <th>Créditos</th>
            <th>Prerrequisitos</th>
            <th>HT</th>
            <th>HS</th>
            <th>HP</th>
            <th>HL</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>2502301</td>
            <td>PROGRAMACIÓN II</td>
            <td>SI</td>
            <td>5</td>
            <td>2501208</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>2.0</td>
            <td>4.0</td>
            <td>8.0</td>
        </tr>
        <tr>
            <td>2502302</td>
            <td>ESTRUCTURAS DE DATOS</td>
            <td>SI</td>
            <td>4</td>
            <td>2501208</td>
            <td>2.0</td>
            <td>0.0</td>
            <td>0.0</td>
            <td>4.0</td>
            <td>6.0</td>
        </tr>
    </table>

</body>
</html>
EOF

echo "✅ Archivo HTML creado en /tmp/courses_test.html"
echo "Para convertir a PDF puedes usar: wkhtmltopdf /tmp/courses_test.html /tmp/courses_test.pdf"
EOF