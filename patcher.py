# Patcher is part of the mkdocs build process. See mkdocs.yml for more info.
import logging
import re


def patch(lines):
	new_lines = []
	for index, line in enumerate(lines):
		# if we don't do any twiddling, carry the line through as-is
		new_line = line

		# match lines starting with a dash or bullet, with leading white space or not
		bullet = re.match(r"^[\s]*[-\*]{1}\s", new_line)

		if bullet:
			logging.warning(f"Found line starting with bullet: '{new_line}'")

			# match lines with leading white space
			has_leading_white_space = re.match(r"^[\s]+[-\*]{1}\s", new_line)
			prior_line_is_bullet = re.match(r"^[-\*]{1}", lines[index - 1].lstrip())
			prior_line_is_blank = re.match(r"^\n", lines[index - 1].lstrip())

			if not prior_line_is_bullet and not prior_line_is_blank:
				logging.warning(f"Adding a new line before '{new_line}'")
				new_lines.append("\n")

			# first item in a bullet list - need to make sure it has no leading whitespace. leave as-is if it's not 1st
			if has_leading_white_space and not prior_line_is_bullet:
				logging.warning(f"Fixing line with bad whitespace: '{new_line}'")
				new_line = new_line.lstrip()

		# match lines starting with a dash or bullet, with leading white space or not
		details_element = re.match(r"<(details+)(?![^>]*\/>)[^>]*>", new_line)

		if details_element:
			logging.warning(f"found line with details element: '{new_line}'")
			new_line = new_line.replace("details", "details markdown=\"1\" ")
			logging.warning(f"repaired line with details element: '{new_line}'")

		new_lines.append(new_line)
	return new_lines
