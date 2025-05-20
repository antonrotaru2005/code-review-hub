package com.review.reviewservice;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class ReviewServiceApplicationTests {
	@Test
	void testExtractRate1() {
		String fb1 = "...### Rate\n75\n";
		assertEquals(75, extractRate(fb1));
	}

	@Test
	void testExtractRate2() {
		String fb2 = "...### Rate\n105\n";   // out of bounds
		assertEquals(100, extractRate(fb2));
	}

	@Test
	void testExtractRate3() {
		String fb3 = "...### Rate\nabc\n100\n";
		assertEquals(100, extractRate(fb3));
	}

	private int extractRate(String feedback) {
		String[] lines = feedback.split("\\r?\\n");
		Pattern numPattern = Pattern.compile("\\b(\\d{1,3})\\b");

		for (int i = 0; i < lines.length; i++) {
			String line = lines[i].toLowerCase();
			if (line.contains("rate")) {
				if (i + 1 < lines.length) {
					String next = lines[i + 1].trim();
					try {
						int rate = Integer.parseInt(next.replaceAll("\\D", ""));
						return clampRate(rate);
					} catch (NumberFormatException ignored) {}
				}
				Matcher m = numPattern.matcher(lines[i]);
				if (m.find()) {
					return clampRate(Integer.parseInt(m.group(1)));
				}
			}
		}

		Matcher m = numPattern.matcher(feedback);
		int last = 0;
		while (m.find()) {
			last = Integer.parseInt(m.group(1));
		}
		return clampRate(last);
	}

	private int clampRate(int rate) {
		if (rate <= 0) return 0;
		return Math.min(100, rate);
	}
}
