# Auto-updated by the release workflow after every macOS build.
# To update manually: node scripts/update-homebrew-cask.mjs <version> <sha256>
cask "ai-engineering-hub" do
  version "0.9.0"
  sha256 "ef8408ee429a86849423108d0e8cd00792de165bd9f979e8db1f00f3d50f0a09"

  url "https://github.com/saeedkolivand/ai-engineering-hub/releases/download/v#{version}/AI%20Engineering%20Hub_#{version}_aarch64.dmg"

  name "AI Engineering Hub"
  desc "Local-first AI ops platform for engineering teams"
  homepage "https://github.com/saeedkolivand/ai-engineering-hub"

  depends_on macos: ">= :big_sur"

  app "AI Engineering Hub.app"

  uninstall quit: "com.aiengineering.hub"

  zap trash: [
    "~/Library/Application Support/com.aiengineering.hub",
    "~/Library/Preferences/com.aiengineering.hub.plist",
    "~/Library/Caches/com.aiengineering.hub",
    "~/Library/Logs/com.aiengineering.hub",
    "~/Library/WebKit/com.aiengineering.hub",
    "~/Library/Saved Application State/com.aiengineering.hub.savedState",
  ]
end
