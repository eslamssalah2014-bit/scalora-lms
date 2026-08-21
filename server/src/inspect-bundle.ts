async function inspectLiveFrontend() {
  console.log('=== INSPECTING LIVE FRONTEND BUNDLE ===\n');

  const htmlRes = await fetch('https://scalora-lms.vercel.app');
  const html = await htmlRes.text();
  console.log('HTML preview:\n', html.slice(0, 500));

  // Find script tags
  const scriptMatches = html.match(/\/assets\/index-[^"]+\.js/g);
  console.log('Found script assets:', scriptMatches);

  if (scriptMatches && scriptMatches.length > 0) {
    const jsUrl = `https://scalora-lms.vercel.app${scriptMatches[0]}`;
    console.log(`Fetching JS bundle: ${jsUrl}`);
    const jsRes = await fetch(jsUrl);
    const jsCode = await jsRes.text();
    console.log(`Bundle size: ${jsCode.length} bytes`);

    // Search for API URL in the bundle
    const renderMatches = jsCode.match(/https:\/\/[a-zA-Z0-9-]+\.onrender\.com[a-zA-Z0-9_\-\/]*/g);
    console.log('Render URL occurrences in bundle:', renderMatches);

    // Search for reset-password in the bundle
    const resetMatches = jsCode.match(/reset-password/g);
    console.log('reset-password occurrences in bundle:', resetMatches?.length);

    // Search for getApiBase pattern
    const apiBaseMatches = jsCode.match(/(\/api|onrender\.com)/g);
    console.log('API references count:', apiBaseMatches?.length);
  }
}

inspectLiveFrontend();
