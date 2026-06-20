# vhs demo tape — render with:  vhs demo.tape
# https://github.com/charmbracelet/vhs
Output assets/demo.gif

Set Theme "Catppuccin Mocha"
Set FontSize 18
Set Width 1280
Set Height 720
Set Padding 24
Set TypingSpeed 60ms

# 1. Intro — what are we even looking at?
Type "# sleep-catcher: find the hard waits that make tests flaky"
Sleep 1500
Enter
Sleep 800

# 2. The money shot — scan a real suite
Type "sleep-catcher examples/"
Sleep 800
Enter
Sleep 4s

# 3. Show it's CI-friendly (exit code 1)
Type "echo \"exit code: $?\""
Sleep 500
Enter
Sleep 2s

# 4. JSON for tooling / dashboards
Type "sleep-catcher examples/ --json | head -n 12"
Sleep 800
Enter
Sleep 4s
