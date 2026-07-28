const fs = require('fs');

let content = fs.readFileSync('src/components/GameBoard.jsx', 'utf8');

const hintOld = `  const [hint, setHint] = useState(null);`;
const hintNew = `  const [hint, setHint] = useState(null);
  const [displayedHint, setDisplayedHint] = useState("");
  const [isTyping, setIsTyping] = useState(false);`;

content = content.replace(hintOld, hintNew);

const executeHintOld = `      const data = await response.json();
      setHint(data.hint);
    } catch (error) {`;
const executeHintNew = `      const data = await response.json();
      setHint(data.hint);
      setDisplayedHint("");
      setIsTyping(true);
    } catch (error) {`;

content = content.replace(executeHintOld, executeHintNew);

const typingEffect = `
  useEffect(() => {
    if (hint && isTyping) {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedHint(hint.slice(0, i + 1));
        i++;
        if (i >= hint.length) {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 40); // 40ms per character
      return () => clearInterval(interval);
    }
  }, [hint, isTyping]);
`;

content = content.replace('const fetchHint = () => {', typingEffect + '\n  const fetchHint = () => {');

const renderHintOld = `      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 max-w-sm w-full p-4 border-l-4 border-yellow-400 bg-yellow-400/10"
          >
            <div className="text-yellow-400 font-cyber text-xs mb-2">SYSTEM.AI_HINT //</div>
            <div className="text-white italic text-sm">"{hint}"</div>
          </motion.div>
        )}
      </AnimatePresence>`;

const renderHintNew = `      <AnimatePresence>
        {hint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 max-w-sm w-full p-4 border-l-4 border-yellow-400 bg-yellow-400/10"
          >
            <div className="text-yellow-400 font-cyber text-xs mb-2">SYSTEM.AI_HINT //</div>
            <div className="text-white italic text-sm font-mono">
              "{displayedHint}"{isTyping && <span className="animate-pulse">_</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

content = content.replace(renderHintOld, renderHintNew);

fs.writeFileSync('src/components/GameBoard.jsx', content);
