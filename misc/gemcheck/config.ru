# frozen_string_literal: true

# A dev app that shows, and writes to ~/gemcheck.txt, the Ruby and gems
# Katana OnDemand's PUN runs OpenComposer with: misc/tests/README.md's
# "Reading the PUN's gems" says how to run it and where its output goes.
require_relative "report"

out = Gemcheck.report
File.write(File.join(Dir.home, "gemcheck.txt"), out)
run ->(_env) { [200, { "content-type" => "text/plain" }, [out]] }
