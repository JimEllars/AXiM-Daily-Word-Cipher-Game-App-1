with open('src/App.jsx', 'r') as f:
    app_content = f.read()

app_content = app_content.replace("import { Toast } from './components/Toast';", "")

with open('src/App.jsx', 'w') as f:
    f.write(app_content)
