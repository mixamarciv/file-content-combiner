Как собрать это расширение

npm install -g yo generator-code vsce
# если надо создать ещё расширение то запусти: "yo code"

# Установи зависимости
npm install

# Запусти автоматическую сборку ts
npm run watch

# Далее для запуска проверки нажимай F5

# Для сборки расширения:
# Создайте .vsix файл
vsce package

# Для установки расширения:
code --install-extension file-content-combiner-1.0.0.vsix


