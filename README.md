
# Цакорпус! :)

Теперь всё так:

- Исходя из кол-ва токенов в корпусе, вычисляем кол-во словоформ, генерируем словоформы
без текстового выражения, но с частотностями
- Исходя из формулы 1+a*f^b, частотности словоформ и средней длины слова частотности 1 
генерируем словам длину (и, видимо, на этом этапе можно и текстовое выражение)
- Генерация лексем и присваивание разборов
- Поприсваивать разборы словоформам с учетом экспоненциального распределения
На этом этапе у нас уже есть список объектов класса Словоформа со свойствами:

  + частотность
  + текстовое представление
  + список разборов, в каждом из которых будет указана лексема

- Имея все эти словоформы, генерируем с их помощью предложения и записаваем их 
в эти самые джейсонины

