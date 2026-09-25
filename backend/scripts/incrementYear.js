import { connectDB, getDB, closeDB } from "../config/mongodb.js";

async function incrementYears() {
  try {
    console.log("Connecting to the database...");
    await connectDB();
    const db = getDB();
    const profiles = db.collection("profiles");
    
    // Find all users who are currently students or members
    const students = await profiles.find({ 
      role: { $in: ["student", "member", "post_holder"] } 
    }).toArray();
    
    console.log(`Found ${students.length} students/members to process.`);
    
    let updatedCount = 0;
    
    for (const student of students) {
        if (!student.year) continue;
        
        let newYear = student.year;
        
        // Try parsing as integer
        let yearNum = parseInt(student.year, 10);
        
        if (!isNaN(yearNum)) {
            yearNum += 1;
            
            // Note: If some business logic needs graduated max year (e.g. 5) 
            // we could handle it here, but by default we just increment.
            
            if (typeof student.year === "string") {
                newYear = yearNum.toString();
            } else {
                newYear = yearNum;
            }
        } else {
            // Handle some common string formats just in case
            const yearMap = {
                "First": "Second", "first": "second", "FIRST": "SECOND",
                "Second": "Third", "second": "third", "SECOND": "THIRD",
                "Third": "Fourth", "third": "fourth", "THIRD": "FOURTH",
                "Fourth": "Fifth", "fourth": "fifth", "FOURTH": "FIFTH",
                "1st": "2nd", "2nd": "3rd", "3rd": "4th", "4th": "5th"
            };
            
            if (yearMap[student.year]) {
                newYear = yearMap[student.year];
            }
        }
        
        // Only update if it actually changed
        if (newYear !== student.year) {
            await profiles.updateOne(
                { _id: student._id },
                { $set: { year: newYear, updated_at: new Date() } }
            );
            updatedCount++;
        }
    }
    
    console.log(`Successfully incremented the year for ${updatedCount} profiles.`);
    
  } catch (error) {
    console.error("Error incrementing years:", error);
  } finally {
    // Always close the connection
    await closeDB();
  }
}

incrementYears();
