// App entry — single consolidated GSLEY site (Clinical Light copy, infused design).

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "darkMode": false,
  "accent": "#0F1B2D",
  "headingFont": "'Plus Jakarta Sans', sans-serif",
  "bodyFont": "'Inter', sans-serif",
  "density": "spacious"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <>
      <DirB tweaks={tweaks} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Visual">
          <TweakToggle label="Dark mode" value={tweaks.darkMode} onChange={v => setTweak('darkMode', v)} />
          <TweakColor label="Accent" value={tweaks.accent} onChange={v => setTweak('accent', v)}
            options={["#0F1B2D", "#1E2A3A", "#0EA5A0", "#14B8A6", "#3B5BDB", "#D4AF37"]} />
          <TweakRadio label="Density" value={tweaks.density} onChange={v => setTweak('density', v)}
            options={[{ value: "compact", label: "Compact" }, { value: "spacious", label: "Spacious" }]} />
        </TweakSection>
        <TweakSection title="Typography">
          <TweakSelect label="Heading font" value={tweaks.headingFont} onChange={v => setTweak('headingFont', v)}
            options={[
              { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
              { value: "'Inter', sans-serif", label: "Inter" },
              { value: "'Playfair Display', serif", label: "Playfair Display" },
            ]} />
          <TweakSelect label="Body font" value={tweaks.bodyFont} onChange={v => setTweak('bodyFont', v)}
            options={[
              { value: "'Inter', sans-serif", label: "Inter" },
              { value: "'Roboto', sans-serif", label: "Roboto" },
              { value: "'Plus Jakarta Sans', sans-serif", label: "Plus Jakarta Sans" },
            ]} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
