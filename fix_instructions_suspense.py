with open('src/App.jsx', 'r') as f:
    content = f.read()

search = """        <Instructions
          isOpen={showInstructions}
          onClose={() => setShowInstructions(false)}
          dict={dict}
        />"""
replace = """        <Suspense fallback={null}>
          <Instructions
            isOpen={showInstructions}
            onClose={() => setShowInstructions(false)}
            dict={dict}
          />
        </Suspense>"""
content = content.replace(search, replace)

with open('src/App.jsx', 'w') as f:
    f.write(content)
