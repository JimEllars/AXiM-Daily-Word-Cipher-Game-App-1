with open('src/App.jsx', 'r') as f:
    content = f.read()

# Let's wrap appContent in a fragment, because `<Instructions />` might be outside the main div?
# Wait, `<Instructions` is just another component, but in the original file:
# return (
#   <CRTOverlay>
#     <div className="grid ...">
#       ...
#       <Instructions />
#       <div className="...">
#         <GuessDistribution />
#       </div>
#     </div>
#   </CRTOverlay>
# )
# Oh, it seems we replaced `<CRTOverlay>` and it closed before `</div>`?
# Let's see line 277 and 278.
# `277: </div>`
# `278: </div>`
# Ah, I replaced `</CRTOverlay>\n  );\n}` with `</div>\n  );\n` but the original had
# `  </CRTOverlay>\n  );\n}`
# Wait, look at line 278: error Parsing error: Adjacent JSX elements must be wrapped in an enclosing tag
# Let's wrap appContent in `<>` and `</>` to be safe.

search = 'const appContent = (\n      <div className="grid grid-rows-[auto_1fr_auto] min-h-[100dvh] w-full overflow-hidden">'
replace = 'const appContent = (\n    <>\n      <div className="grid grid-rows-[auto_1fr_auto] min-h-[100dvh] w-full overflow-hidden">'
content = content.replace(search, replace)

search_end = """        <div className="w-full mt-auto opacity-75 pb-safe pb-[env(safe-area-inset-bottom)]">
          <GuessDistribution dictionary={dict} />
        </div>
</div>
    </div>
  );"""
replace_end = """        <div className="w-full mt-auto opacity-75 pb-safe pb-[env(safe-area-inset-bottom)]">
          <GuessDistribution dictionary={dict} />
        </div>
      </div>
    </>
  );"""
content = content.replace(search_end, replace_end)

with open('src/App.jsx', 'w') as f:
    f.write(content)
