with open('src/App.jsx', 'r') as f:
    content = f.read()

# React imports
if "import React, { useState, useEffect" in content and "Suspense" not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, Suspense, lazy } from 'react';")

# Replace imports for Leaderboard and Instructions
content = content.replace("import Leaderboard from './components/Leaderboard';", "const Leaderboard = lazy(() => import('./components/Leaderboard'));")
content = content.replace("import Instructions from './components/Instructions';", "const Instructions = lazy(() => import('./components/Instructions'));")

# Add Suspense boundary for Leaderboard
search_leaderboard = "<Leaderboard \n          isOpen={showLeaderboard} \n          onClose={() => setShowLeaderboard(false)} \n          dict={dict} \n          walletAddress={walletAddress}\n        />"
replace_leaderboard = """<Suspense fallback={null}>
          <Leaderboard
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            dict={dict}
            walletAddress={walletAddress}
          />
        </Suspense>"""
content = content.replace(search_leaderboard, replace_leaderboard)

# We can find `<Leaderboard` more safely:
import re
content = re.sub(r'(<Leaderboard[^>]*/>)', r'<Suspense fallback={null}>\1</Suspense>', content)
content = re.sub(r'(<Instructions[^>]*/>)', r'<Suspense fallback={null}>\1</Suspense>', content)

# Now, lazy load CRTOverlay.
# To avoid the entire tree suspending, let's redefine CRTOverlay locally, extracting the heavy effects into a lazily-loaded component.
# Actually, the requirement asks to lazy load `<CRTOverlay />`.
# "In src/App.jsx, implement React Suspense and lazy() for heavy, non-critical components (like the <CRTOverlay /> or the <MintModal />) so they do not block the primary thread from rendering the game board instantly."
# "The transition to lazy() loading in Task 3 must include a visually unobtrusive fallback in the <Suspense fallback={...}> block to prevent jarring UI jumps."

# What if we lazy load CRTOverlay and render the children in the fallback?
# `const CRTOverlay = lazy(() => import('./components/layout/CRTOverlay'));`
# `const AppContent = (props) => ( <div className="grid ...">{...}</div> )`
# Then:
# <Suspense fallback={<div className="relative min-h-[100dvh] h-[100dvh] w-full bg-[#0d0d13] overflow-y-auto flex flex-col"><div className="relative z-10 flex flex-col items-center flex-1 h-full w-full">{appContent}</div></div>}>
#   <CRTOverlay>{appContent}</CRTOverlay>
# </Suspense>

# Let's see how `return (` looks in App.jsx.
search_return = "return (\n    <CRTOverlay>"
content = content.replace(search_return, "const appContent = (")

# And close appContent at the end:
search_end = "    </CRTOverlay>\n  );\n}"
replace_end = """    </div>
  );

  return (
    <Suspense fallback={
      <div className="relative min-h-[100dvh] h-[100dvh] w-full bg-[#0d0d13] overflow-y-auto flex flex-col">
        <div className="relative z-10 flex flex-col items-center flex-1 h-full w-full">
          {appContent}
        </div>
      </div>
    }>
      <CRTOverlay>
        {appContent}
      </CRTOverlay>
    </Suspense>
  );
}"""

content = content.replace("    </CRTOverlay>\n  );\n}", replace_end)
content = content.replace("import CRTOverlay from './components/layout/CRTOverlay';", "const CRTOverlay = lazy(() => import('./components/layout/CRTOverlay'));")
# Also need to remove the first `<CRTOverlay>` that followed `return (`
content = content.replace("const appContent = (\n    <CRTOverlay>\n      <div", "const appContent = (\n      <div")

with open('src/App.jsx', 'w') as f:
    f.write(content)

print("Patched App.jsx")
