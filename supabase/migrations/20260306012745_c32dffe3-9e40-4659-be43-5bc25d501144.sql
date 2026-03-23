UPDATE students SET series = '3ª SÉRIE' WHERE series NOT LIKE '3ª%' AND series LIKE '3%' AND series LIKE '%RIE%';
UPDATE students SET series = '2ª SÉRIE' WHERE series NOT LIKE '2ª%' AND series LIKE '2%' AND series LIKE '%RIE%';
UPDATE students SET series = '1ª SÉRIE' WHERE series NOT LIKE '1ª%' AND series LIKE '1%' AND series LIKE '%RIE%';
UPDATE students SET name = REPLACE(name, '�', '') WHERE name LIKE '%�%';