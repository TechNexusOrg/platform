import { getDb, schema } from "@/lib/db";
import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { PILOT_LEARNING_TRACKS } from "./content";

export interface TrackListItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  isPublished: boolean;
  orderIndex: number;
  prerequisites: string[];
  objectives: string[];
  moduleCount: number;
  lessonCount: number;
  enrollmentStatus?: "enrolled" | "in_progress" | "completed" | null;
  completedLessonsCount?: number;
  progressPercentage?: number;
}

export interface DetailedTrack extends TrackListItem {
  modules: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    orderIndex: number;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      estimatedMinutes: number;
      orderIndex: number;
      isCompleted?: boolean;
      hasAssignment: boolean;
    }>;
  }>;
}

export interface DetailedLesson {
  id: string;
  slug: string;
  title: string;
  content: string;
  estimatedMinutes: number;
  orderIndex: number;
  isCompleted: boolean;
  module: {
    id: string;
    slug: string;
    title: string;
  };
  track: {
    id: string;
    slug: string;
    title: string;
  };
  previousLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  assignment?: {
    id: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    submissionType: "github_pr" | "text_submission" | "terminal_output";
    userSubmission?: {
      id: string;
      content: string;
      status: "submitted" | "approved" | "needs_revision";
      feedback?: string | null;
      submittedAt: Date;
    } | null;
  } | null;
}

/**
 * Seeds pilot curriculum tracks, modules, lessons, and assignments into the database.
 * Operates idempotently by matching unique slugs.
 */
export async function seedPilotCurriculum(database?: any) {
  const db = database || (await getDb());

  for (const trackData of PILOT_LEARNING_TRACKS) {
    let [track] = await db
      .select()
      .from(schema.learningTracks)
      .where(eq(schema.learningTracks.slug, trackData.slug));

    const trackId = track?.id || `trk_${crypto.randomUUID()}`;

    if (!track) {
      [track] = await db
        .insert(schema.learningTracks)
        .values({
          id: trackId,
          slug: trackData.slug,
          title: trackData.title,
          description: trackData.description,
          difficulty: trackData.difficulty,
          estimatedHours: trackData.estimatedHours,
          isPublished: trackData.isPublished,
          orderIndex: trackData.orderIndex,
          prerequisites: trackData.prerequisites,
          objectives: trackData.objectives,
        })
        .returning();
    } else {
      await db
        .update(schema.learningTracks)
        .set({
          title: trackData.title,
          description: trackData.description,
          difficulty: trackData.difficulty,
          estimatedHours: trackData.estimatedHours,
          isPublished: trackData.isPublished,
          orderIndex: trackData.orderIndex,
          prerequisites: trackData.prerequisites,
          objectives: trackData.objectives,
          updatedAt: new Date(),
        })
        .where(eq(schema.learningTracks.id, trackId));
    }

    // Process modules
    for (const modData of trackData.modules) {
      let [moduleRecord] = await db
        .select()
        .from(schema.learningModules)
        .where(
          and(
            eq(schema.learningModules.trackId, trackId),
            eq(schema.learningModules.slug, modData.slug)
          )
        );

      const moduleId = moduleRecord?.id || `mod_${crypto.randomUUID()}`;

      if (!moduleRecord) {
        [moduleRecord] = await db
          .insert(schema.learningModules)
          .values({
            id: moduleId,
            trackId,
            slug: modData.slug,
            title: modData.title,
            description: modData.description,
            orderIndex: modData.orderIndex,
          })
          .returning();
      } else {
        await db
          .update(schema.learningModules)
          .set({
            title: modData.title,
            description: modData.description,
            orderIndex: modData.orderIndex,
            updatedAt: new Date(),
          })
          .where(eq(schema.learningModules.id, moduleId));
      }

      // Process lessons
      for (const lesData of modData.lessons) {
        let [lessonRecord] = await db
          .select()
          .from(schema.learningLessons)
          .where(
            and(
              eq(schema.learningLessons.moduleId, moduleId),
              eq(schema.learningLessons.slug, lesData.slug)
            )
          );

        const lessonId = lessonRecord?.id || `les_${crypto.randomUUID()}`;

        if (!lessonRecord) {
          [lessonRecord] = await db
            .insert(schema.learningLessons)
            .values({
              id: lessonId,
              moduleId,
              slug: lesData.slug,
              title: lesData.title,
              content: lesData.content,
              estimatedMinutes: lesData.estimatedMinutes,
              orderIndex: lesData.orderIndex,
            })
            .returning();
        } else {
          await db
            .update(schema.learningLessons)
            .set({
              title: lesData.title,
              content: lesData.content,
              estimatedMinutes: lesData.estimatedMinutes,
              orderIndex: lesData.orderIndex,
              updatedAt: new Date(),
            })
            .where(eq(schema.learningLessons.id, lessonId));
        }

        // Process assignment if specified
        if (lesData.assignment) {
          const [existingAssignment] = await db
            .select()
            .from(schema.learningAssignments)
            .where(eq(schema.learningAssignments.lessonId, lessonId));

          if (!existingAssignment) {
            await db.insert(schema.learningAssignments).values({
              id: `asg_${crypto.randomUUID()}`,
              lessonId,
              title: lesData.assignment.title,
              description: lesData.assignment.description,
              acceptanceCriteria: lesData.assignment.acceptanceCriteria,
              submissionType: lesData.assignment.submissionType,
            });
          } else {
            await db
              .update(schema.learningAssignments)
              .set({
                title: lesData.assignment.title,
                description: lesData.assignment.description,
                acceptanceCriteria: lesData.assignment.acceptanceCriteria,
                submissionType: lesData.assignment.submissionType,
              })
              .where(eq(schema.learningAssignments.id, existingAssignment.id));
          }
        }
      }
    }
  }
}

/**
 * Lists all learning tracks with module and lesson counts and user-specific progress.
 */
export async function listTracks(
  options?: { userId?: string; publishedOnly?: boolean },
  database?: any
): Promise<TrackListItem[]> {
  const db = database || (await getDb());
  const publishedOnly = options?.publishedOnly ?? true;

  let query = db.select().from(schema.learningTracks);
  if (publishedOnly) {
    query = query.where(eq(schema.learningTracks.isPublished, true));
  }

  const tracks = await query.orderBy(asc(schema.learningTracks.orderIndex));

  // If tracks are empty, run idempotent pilot seed once
  if (tracks.length === 0) {
    await seedPilotCurriculum(db);
    return listTracks(options, db);
  }

  const results: TrackListItem[] = [];

  for (const track of tracks) {
    const modules = await db
      .select({ id: schema.learningModules.id })
      .from(schema.learningModules)
      .where(eq(schema.learningModules.trackId, track.id));

    const moduleIds = modules.map((m: any) => m.id);

    let lessonCount = 0;
    let completedLessonsCount = 0;
    let enrollmentStatus: "enrolled" | "in_progress" | "completed" | null = null;

    if (moduleIds.length > 0) {
      const lessons = await db
        .select({ id: schema.learningLessons.id })
        .from(schema.learningLessons)
        .where(inArray(schema.learningLessons.moduleId, moduleIds));

      lessonCount = lessons.length;

      if (options?.userId && lessonCount > 0) {
        const lessonIds = lessons.map((l: any) => l.id);

        const completedRows = await db
          .select({ id: schema.lessonProgress.id })
          .from(schema.lessonProgress)
          .where(
            and(
              eq(schema.lessonProgress.userId, options.userId),
              eq(schema.lessonProgress.completed, true),
              inArray(schema.lessonProgress.lessonId, lessonIds)
            )
          );

        completedLessonsCount = completedRows.length;

        const [enrollment] = await db
          .select()
          .from(schema.learningEnrollments)
          .where(
            and(
              eq(schema.learningEnrollments.userId, options.userId),
              eq(schema.learningEnrollments.trackId, track.id)
            )
          );

        if (enrollment) {
          enrollmentStatus = enrollment.status as any;
        }
      }
    }

    const progressPercentage =
      lessonCount > 0
        ? Math.round((completedLessonsCount / lessonCount) * 100)
        : 0;

    results.push({
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      difficulty: track.difficulty as any,
      estimatedHours: track.estimatedHours,
      isPublished: track.isPublished,
      orderIndex: track.orderIndex,
      prerequisites: (track.prerequisites as string[]) || [],
      objectives: (track.objectives as string[]) || [],
      moduleCount: modules.length,
      lessonCount,
      enrollmentStatus,
      completedLessonsCount,
      progressPercentage,
    });
  }

  return results;
}

/**
 * Fetches detailed track syllabus including all modules, lessons, and user completion status.
 */
export async function getTrackBySlug(
  slug: string,
  userId?: string,
  database?: any
): Promise<DetailedTrack | null> {
  const db = database || (await getDb());

  const [track] = await db
    .select()
    .from(schema.learningTracks)
    .where(eq(schema.learningTracks.slug, slug));

  if (!track) {
    // If not found, attempt auto-seed if tracks table is completely empty
    const all = await db.select().from(schema.learningTracks);
    if (all.length === 0) {
      await seedPilotCurriculum(db);
      return getTrackBySlug(slug, userId, db);
    }
    return null;
  }

  const modules = await db
    .select()
    .from(schema.learningModules)
    .where(eq(schema.learningModules.trackId, track.id))
    .orderBy(asc(schema.learningModules.orderIndex));

  const moduleIds = modules.map((m: any) => m.id);

  let lessons: any[] = [];
  let assignments: any[] = [];
  let userProgress: any[] = [];

  if (moduleIds.length > 0) {
    lessons = await db
      .select()
      .from(schema.learningLessons)
      .where(inArray(schema.learningLessons.moduleId, moduleIds))
      .orderBy(asc(schema.learningLessons.orderIndex));

    const lessonIds = lessons.map((l: any) => l.id);

    if (lessonIds.length > 0) {
      assignments = await db
        .select()
        .from(schema.learningAssignments)
        .where(inArray(schema.learningAssignments.lessonId, lessonIds));

      if (userId) {
        userProgress = await db
          .select()
          .from(schema.lessonProgress)
          .where(
            and(
              eq(schema.lessonProgress.userId, userId),
              inArray(schema.lessonProgress.lessonId, lessonIds)
            )
          );
      }
    }
  }

  const completedLessonIdSet = new Set(
    userProgress
      .filter((p: any) => p.completed)
      .map((p: any) => p.lessonId)
  );

  const assignmentLessonIdSet = new Set(
    assignments.map((a: any) => a.lessonId)
  );

  const modulesWithLessons = modules.map((mod: any) => {
    const modLessons = lessons
      .filter((l: any) => l.moduleId === mod.id)
      .map((l: any) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        estimatedMinutes: l.estimatedMinutes,
        orderIndex: l.orderIndex,
        isCompleted: completedLessonIdSet.has(l.id),
        hasAssignment: assignmentLessonIdSet.has(l.id),
      }));

    return {
      id: mod.id,
      slug: mod.slug,
      title: mod.title,
      description: mod.description,
      orderIndex: mod.orderIndex,
      lessons: modLessons,
    };
  });

  const totalLessons = lessons.length;
  const completedLessonsCount = completedLessonIdSet.size;
  const progressPercentage =
    totalLessons > 0
      ? Math.round((completedLessonsCount / totalLessons) * 100)
      : 0;

  let enrollmentStatus: "enrolled" | "in_progress" | "completed" | null = null;
  if (userId) {
    const [enrollment] = await db
      .select()
      .from(schema.learningEnrollments)
      .where(
        and(
          eq(schema.learningEnrollments.userId, userId),
          eq(schema.learningEnrollments.trackId, track.id)
        )
      );
    if (enrollment) {
      enrollmentStatus = enrollment.status as any;
    }
  }

  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    description: track.description,
    difficulty: track.difficulty as any,
    estimatedHours: track.estimatedHours,
    isPublished: track.isPublished,
    orderIndex: track.orderIndex,
    prerequisites: (track.prerequisites as string[]) || [],
    objectives: (track.objectives as string[]) || [],
    moduleCount: modules.length,
    lessonCount: totalLessons,
    enrollmentStatus,
    completedLessonsCount,
    progressPercentage,
    modules: modulesWithLessons,
  };
}

/**
 * Fetches a specific lesson with markdown content, parent track & module info,
 * previous/next navigation, and assignment (including student's submission if logged in).
 */
export async function getLesson(
  trackSlug: string,
  lessonSlug: string,
  userId?: string,
  database?: any
): Promise<DetailedLesson | null> {
  const db = database || (await getDb());

  const [track] = await db
    .select()
    .from(schema.learningTracks)
    .where(eq(schema.learningTracks.slug, trackSlug));

  if (!track) return null;

  const modules = await db
    .select()
    .from(schema.learningModules)
    .where(eq(schema.learningModules.trackId, track.id))
    .orderBy(asc(schema.learningModules.orderIndex));

  const moduleIds = modules.map((m: any) => m.id);
  if (moduleIds.length === 0) return null;

  // Fetch all lessons in track to establish navigation order
  const allLessons = await db
    .select()
    .from(schema.learningLessons)
    .where(inArray(schema.learningLessons.moduleId, moduleIds))
    .orderBy(asc(schema.learningLessons.orderIndex));

  // Sort lessons according to module orderIndex, then lesson orderIndex
  const moduleOrderMap = new Map<string, number>(
    modules.map((m: any) => [m.id, m.orderIndex as number])
  );
  allLessons.sort((a: any, b: any) => {
    const modOrderA = Number(moduleOrderMap.get(a.moduleId) ?? 0);
    const modOrderB = Number(moduleOrderMap.get(b.moduleId) ?? 0);
    if (modOrderA !== modOrderB) return modOrderA - modOrderB;
    return a.orderIndex - b.orderIndex;
  });

  const currentIndex = allLessons.findIndex((l: any) => l.slug === lessonSlug);
  if (currentIndex === -1) return null;

  const currentLesson = allLessons[currentIndex];
  const parentModule = modules.find((m: any) => m.id === currentLesson.moduleId);

  const prevLessonObj =
    currentIndex > 0
      ? {
          slug: allLessons[currentIndex - 1].slug,
          title: allLessons[currentIndex - 1].title,
        }
      : null;

  const nextLessonObj =
    currentIndex < allLessons.length - 1
      ? {
          slug: allLessons[currentIndex + 1].slug,
          title: allLessons[currentIndex + 1].title,
        }
      : null;

  // Check lesson completion status for user
  let isCompleted = false;
  if (userId) {
    const [progress] = await db
      .select()
      .from(schema.lessonProgress)
      .where(
        and(
          eq(schema.lessonProgress.userId, userId),
          eq(schema.lessonProgress.lessonId, currentLesson.id)
        )
      );
    isCompleted = !!progress?.completed;
  }

  // Check for assignment
  const [assignment] = await db
    .select()
    .from(schema.learningAssignments)
    .where(eq(schema.learningAssignments.lessonId, currentLesson.id));

  let userSubmission = null;
  if (assignment && userId) {
    const [submission] = await db
      .select()
      .from(schema.assignmentSubmissions)
      .where(
        and(
          eq(schema.assignmentSubmissions.userId, userId),
          eq(schema.assignmentSubmissions.assignmentId, assignment.id)
        )
      )
      .orderBy(desc(schema.assignmentSubmissions.submittedAt));

    if (submission) {
      userSubmission = {
        id: submission.id,
        content: submission.content,
        status: submission.status as any,
        feedback: submission.feedback,
        submittedAt: submission.submittedAt,
      };
    }
  }

  return {
    id: currentLesson.id,
    slug: currentLesson.slug,
    title: currentLesson.title,
    content: currentLesson.content,
    estimatedMinutes: currentLesson.estimatedMinutes,
    orderIndex: currentLesson.orderIndex,
    isCompleted,
    module: {
      id: parentModule.id,
      slug: parentModule.slug,
      title: parentModule.title,
    },
    track: {
      id: track.id,
      slug: track.slug,
      title: track.title,
    },
    previousLesson: prevLessonObj,
    nextLesson: nextLessonObj,
    assignment: assignment
      ? {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          acceptanceCriteria: (assignment.acceptanceCriteria as string[]) || [],
          submissionType: assignment.submissionType as any,
          userSubmission,
        }
      : null,
  };
}

/**
 * Enrolls a user into a learning track.
 */
export async function enrollInTrack(
  userId: string,
  trackId: string,
  database?: any
) {
  const db = database || (await getDb());

  const [track] = await db
    .select()
    .from(schema.learningTracks)
    .where(eq(schema.learningTracks.id, trackId));

  if (!track) {
    throw new Error("Track not found");
  }

  const [existing] = await db
    .select()
    .from(schema.learningEnrollments)
    .where(
      and(
        eq(schema.learningEnrollments.userId, userId),
        eq(schema.learningEnrollments.trackId, trackId)
      )
    );

  if (existing) {
    return existing;
  }

  const [enrollment] = await db
    .insert(schema.learningEnrollments)
    .values({
      id: `enr_${crypto.randomUUID()}`,
      userId,
      trackId,
      status: "enrolled",
    })
    .returning();

  return enrollment;
}

/**
 * Toggles a lesson's completion status for a user and updates overall track progress.
 */
export async function toggleLessonProgress(
  userId: string,
  lessonId: string,
  completed: boolean,
  database?: any
) {
  const db = database || (await getDb());

  const [lesson] = await db
    .select()
    .from(schema.learningLessons)
    .where(eq(schema.learningLessons.id, lessonId));

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  const [parentModule] = await db
    .select()
    .from(schema.learningModules)
    .where(eq(schema.learningModules.id, lesson.moduleId));

  if (!parentModule) {
    throw new Error("Parent module not found");
  }

  const trackId = parentModule.trackId;

  // Auto-enroll if not enrolled
  await enrollInTrack(userId, trackId, db);

  // Upsert lesson progress
  const [existingProgress] = await db
    .select()
    .from(schema.lessonProgress)
    .where(
      and(
        eq(schema.lessonProgress.userId, userId),
        eq(schema.lessonProgress.lessonId, lessonId)
      )
    );

  if (existingProgress) {
    await db
      .update(schema.lessonProgress)
      .set({
        completed,
        completedAt: completed ? new Date() : existingProgress.completedAt,
      })
      .where(eq(schema.lessonProgress.id, existingProgress.id));
  } else if (completed) {
    await db.insert(schema.lessonProgress).values({
      id: `lpr_${crypto.randomUUID()}`,
      userId,
      lessonId,
      completed: true,
      completedAt: new Date(),
    });
  }

  // Recalculate track progress
  const allModules = await db
    .select({ id: schema.learningModules.id })
    .from(schema.learningModules)
    .where(eq(schema.learningModules.trackId, trackId));

  const allLessons = await db
    .select({ id: schema.learningLessons.id })
    .from(schema.learningLessons)
    .where(
      inArray(
        schema.learningLessons.moduleId,
        allModules.map((m: any) => m.id)
      )
    );

  const lessonIds = allLessons.map((l: any) => l.id);

  const completedProgressRows = await db
    .select()
    .from(schema.lessonProgress)
    .where(
      and(
        eq(schema.lessonProgress.userId, userId),
        eq(schema.lessonProgress.completed, true),
        inArray(schema.lessonProgress.lessonId, lessonIds)
      )
    );

  const totalLessons = lessonIds.length;
  const completedCount = completedProgressRows.length;
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  let newStatus: "enrolled" | "in_progress" | "completed" = "in_progress";
  let completedAt: Date | null = null;

  if (completedCount === totalLessons && totalLessons > 0) {
    newStatus = "completed";
    completedAt = new Date();
  } else if (completedCount === 0) {
    newStatus = "enrolled";
  }

  await db
    .update(schema.learningEnrollments)
    .set({
      status: newStatus,
      completedAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.learningEnrollments.userId, userId),
        eq(schema.learningEnrollments.trackId, trackId)
      )
    );

  return {
    lessonId,
    completed,
    totalLessons,
    completedLessons: completedCount,
    progressPercentage,
    trackStatus: newStatus,
  };
}

/**
 * Submits student work for a lesson assignment.
 */
export async function submitAssignment(
  userId: string,
  assignmentId: string,
  content: string,
  database?: any
) {
  const db = database || (await getDb());

  if (!content || !content.trim()) {
    throw new Error("Submission content cannot be empty");
  }

  const [assignment] = await db
    .select()
    .from(schema.learningAssignments)
    .where(eq(schema.learningAssignments.id, assignmentId));

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  // Validate GitHub PR submission type
  if (assignment.submissionType === "github_pr") {
    const prUrlPattern = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/;
    if (!prUrlPattern.test(content.trim())) {
      throw new Error(
        "Invalid GitHub PR URL. Format must match: https://github.com/owner/repo/pull/number"
      );
    }
  }

  const [existingSubmission] = await db
    .select()
    .from(schema.assignmentSubmissions)
    .where(
      and(
        eq(schema.assignmentSubmissions.userId, userId),
        eq(schema.assignmentSubmissions.assignmentId, assignmentId)
      )
    );

  const now = new Date();

  if (existingSubmission) {
    const [updated] = await db
      .update(schema.assignmentSubmissions)
      .set({
        content: content.trim(),
        status: "submitted",
        feedback: null,
        submittedAt: now,
      })
      .where(eq(schema.assignmentSubmissions.id, existingSubmission.id))
      .returning();

    return updated;
  }

  const [submission] = await db
    .insert(schema.assignmentSubmissions)
    .values({
      id: `sub_${crypto.randomUUID()}`,
      assignmentId,
      userId,
      content: content.trim(),
      status: "submitted",
      submittedAt: now,
    })
    .returning();

  return submission;
}
