import re
from typing import List, Dict

def extract_section_number(text: str) -> str:
    """Extracts leading numbers like '3.' or '3.1.2' from text."""
    match = re.match(r'^(\d+(\.\d+)*)\.?\s+', text)
    return match.group(1) if match else ""

def is_child_of(child_num: str, parent_num: str) -> bool:
    """Checks if '3.1' is a child of '3'."""
    if not child_num or not parent_num:
        return False
    return child_num.startswith(parent_num + ".")

def group_elements_by_topic(elements: List) -> List[Dict]:
    """
    Groups unstructured elements into logical 'Topics'.
    A topic start when a top-level heading (e.g., '3. Alkanes') is found.
    Subsequent sub-headings (e.g., '3.1 Methane') and text belong to that topic.
    """
    topics = []
    current_topic = {
        "title": "Introduction",
        "elements": [],
        "section_number": ""
    }

    for el in elements:
        el_type = type(el).__name__
        text = el.text.strip()

        # Check if this element is a potential new Topic Header
        is_title = el_type == 'Title' or (hasattr(el.metadata, 'category') and el.metadata.category == 'Title')
        
        if is_title:
            sec_num = extract_section_number(text)
            
            # If it's a top-level section (e.g., '3.' not '3.1') or a major heading change
            # we start a new 'Major Topic'
            is_top_level = sec_num and "." not in sec_num
            
            if is_top_level or (not sec_num and len(text) < 100): # Heuristic for non-numbered major titles
                if current_topic["elements"]:
                    topics.append(current_topic)
                
                current_topic = {
                    "title": text,
                    "elements": [el],
                    "section_number": sec_num
                }
                continue

        # Add element to current topic
        current_topic["elements"].append(el)

    # Add the last one
    if current_topic["elements"]:
        topics.append(current_topic)

    return topics
