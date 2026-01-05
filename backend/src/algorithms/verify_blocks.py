import json
import sys
from collections import defaultdict

def verify_blocks(schedule_file):
    with open(schedule_file, 'r') as f:
        data = json.load(f)
    
    schedule = data['schedule']
    
    # Group by course and day
    courses = defaultdict(lambda: defaultdict(list))
    
    for entry in schedule:
        course_base = entry['course_code']
        # Distinguish Theory/Lab if needed, but requirements say "1 curso"
        # usually means the specific component (Theory or Lab).
        # Let's treat them as separate schedulable units first, as per GA logic.
        # But wait, user said "1 curso", might refer to the whole subject.
        # However, run_ga splits them. Let's check consistency per component.
        
        # entry['course_name'] usually contains (Teoría) or (Laboratorio)
        full_name = entry['course_name']
        day = entry['day_of_week']
        start_time = entry['start_time']
        
        courses[full_name][day].append(start_time)
        
    print(f"Verifying {len(courses)} courses...")
    
    violations = 0
    
    for course_name, days in courses.items():
        total_hours = sum(len(times) for times in days.values())
        
        # Only check even numbered courses or >= 2 hours
        if total_hours < 2:
            continue
            
        for day, times in days.items():
            # Convert times to integers for easier sorting/checking
            # Format HH:MM
            hours = sorted([int(t.split(':')[0]) for t in times])
            
            # Check for blocks
            # Simple check: are they consecutive?
            # We want to identify isolated hours.
            
            if not hours:
                continue
                
            # Group into consecutive blocks
            blocks = []
            if hours:
                current_block = [hours[0]]
                for i in range(1, len(hours)):
                    if hours[i] == hours[i-1] + 1:
                        current_block.append(hours[i])
                    else:
                        blocks.append(current_block)
                        current_block = [hours[i]]
                blocks.append(current_block)
            
            # Check block sizes
            for block in blocks:
                if len(block) < 2:
                    # Allow isolated block ONLY if total hours is odd and we have an odd block?
                    # Ideally we want NO isolated blocks if possible, or at most 1 if total is odd.
                    # User said: "NUNCA un bloque suelto (a menos que sean horas impares)"
                    
                    # If total hours is Even, then NO blocks of 1 allowed.
                    if total_hours % 2 == 0:
                        print(f"❌ VIOLATION: {course_name} on {day} has isolated hour {block} (Total hours: {total_hours})")
                        violations += 1
                    else:
                        # If total is odd, we tolerate specific cases, but let's just log it for now
                        print(f"⚠️ WARNING: {course_name} on {day} has isolated hour {block} (Total hours: {total_hours} - Odd)")

                # Check 2: Max hours per block (Strictly 2, unless exception)
                # Exception: Theory+Lab can be 4, but individually they are separate courses in GA.
                # Here we check per-course-code. If verify_blocks aggregates by name/type, we need to be careful.
                # But usually output.json has separate entries.
                # We will strictly enforce max 2 for any single entry.
                if len(block) > 2:
                    print(f"❌ VIOLATION: {course_name} on {day} has block size {len(block)} (Max 2 allowed)")
                    violations += 1

    if violations == 0:
        print("✅ SUCCESS: No isolated blocks found for even-hour courses.")
    else:
        print(f"❌ FAILED: Found {violations} violations.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_blocks.py <schedule.json>")
        sys.exit(1)
    verify_blocks(sys.argv[1])
