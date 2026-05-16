const topBackBtn = document.querySelector("#topBackBtn");
const backToCategoriesBtn = document.querySelector("#backToCategoriesBtn");
const groupInfoTab = document.querySelector("#groupInfoTab");
const openPostTaskModalBtn = document.querySelector("#openPostTaskModalBtn");
const postTaskModalOverlay = document.querySelector("#postTaskModalOverlay");
const discardPostTaskBtn = document.querySelector("#discardPostTaskBtn");
const postTaskForm = document.querySelector("#postTaskForm");
const postTaskSubmitBtn = postTaskForm ? postTaskForm.querySelector("button[type='submit']") : null;
const taskNameInput = postTaskForm ? postTaskForm.querySelector("#taskNameInput") : null;
const dueDateInput = postTaskForm ? postTaskForm.querySelector("#dueDateInput") : null;
const dueTimeInput = postTaskForm ? postTaskForm.querySelector("#dueTimeInput") : null;
const taskDescriptionInput = postTaskForm ? postTaskForm.querySelector("#taskDescriptionInput") : null;
const taskResourcesInput = postTaskForm ? postTaskForm.querySelector("#taskResourcesInput") : null;
const verifyChoiceOverlay = document.querySelector("#verifyChoiceOverlay");
const verifyFinishBtn = document.querySelector("#verifyFinishBtn");
const verifyReviseBtn = document.querySelector("#verifyReviseBtn");
const verifyCloseBtn = document.querySelector("#verifyCloseBtn");
const pauseFinishChoiceOverlay = document.querySelector("#pauseFinishChoiceOverlay");
const pauseFinishPauseBtn = document.querySelector("#pauseFinishPauseBtn");
const pauseFinishFinishBtn = document.querySelector("#pauseFinishFinishBtn");
const pauseFinishCloseBtn = document.querySelector("#pauseFinishCloseBtn");
const taskSettingsOverlay = document.querySelector("#taskSettingsOverlay");
const openEditTaskInfoBtn = document.querySelector("#openEditTaskInfoBtn");
const openManualStatusBtn = document.querySelector("#openManualStatusBtn");
const openRemoveTaskConfirmBtn = document.querySelector("#openRemoveTaskConfirmBtn");
const discardTaskSettingsBtn = document.querySelector("#discardTaskSettingsBtn");
const editTaskInfoOverlay = document.querySelector("#editTaskInfoOverlay");
const editTaskInfoForm = document.querySelector("#editTaskInfoForm");
const discardEditTaskInfoBtn = document.querySelector("#discardEditTaskInfoBtn");
const saveEditTaskInfoBtn = document.querySelector("#saveEditTaskInfoBtn");
const editTaskNameInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editTaskNameInput") : null;
const editTaskDescriptionInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editTaskDescriptionInput") : null;
const editTaskResourcesInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editTaskResourcesInput") : null;
const editDueDateInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editDueDateInput") : null;
const editDueTimeInput = editTaskInfoForm ? editTaskInfoForm.querySelector("#editDueTimeInput") : null;
const manualStatusOverlay = document.querySelector("#manualStatusOverlay");
const manualStatusButtons = Array.from(document.querySelectorAll("[data-manual-status]"));
const discardManualStatusBtn = document.querySelector("#discardManualStatusBtn");
const removeTaskConfirmOverlay = document.querySelector("#removeTaskConfirmOverlay");
const confirmRemoveTaskBtn = document.querySelector("#confirmRemoveTaskBtn");
const discardRemoveTaskBtn = document.querySelector("#discardRemoveTaskBtn");
const taskDetailsOverlay = document.querySelector("#taskDetailsOverlay");
const closeTaskDetailsBtn = document.querySelector("#closeTaskDetailsBtn");
const detailTaskName = document.querySelector("#detailTaskName");
const detailTaskDescription = document.querySelector("#detailTaskDescription");
const detailTaskResources = document.querySelector("#detailTaskResources");
const detailTaskAssignees = document.querySelector("#detailTaskAssignees");
const detailTaskDueDate = document.querySelector("#detailTaskDueDate");
const detailTaskDueTime = document.querySelector("#detailTaskDueTime");
const detailTaskStatus = document.querySelector("#detailTaskStatus");
const detailTaskTimeActive = document.querySelector("#detailTaskTimeActive");

let activeTaskIndex = null;
let currentUserId = null;

const STAT_ID = { inactive:1, active:2, pause:3, verifying:4, finished:5, missing:6 };
const STAT_SLUG = { 1:"inactive", 2:"active", 3:"pause", 4:"verifying", 5:"finished", 6:"missing" };
const STATUS_TEXT = { inactive:"Not Active", active:"Active", pause:"On Break", verifying:"Verifying", finished:"Finished", missing:"Missing" };

const isTerminal = (s) => s === "finished" || s === "missing";
const isPastDue  = (t) => !(!t.dueDate || !t.dueTime) && Date.now() > new Date(`${t.dueDate}T${t.dueTime}`).getTime();
const supa       = () => window.hiveSupabase;
const getProjId  = () => sessionStorage.getItem("hive_selected_project");
const getGrpId   = () => sessionStorage.getItem("hive_grpId");

const applyStatusToBtn = (btn, status) => {
    btn.textContent = STATUS_TEXT[status] || status;
    btn.className = `task-status ${status}`;
    btn.disabled = isTerminal(status) || status === "verifying";
};

const loadTasks = async () => {
    const projId = getProjId();
    if (!projId) return [];
    const { data, error } = await supa()
        .from("TASK")
        .select("taskId, taskName, taskDesc, taskDueD, taskIntensity, taskPrio, statId, GROUPMEMBER(grpmemId, userId, USER(userDisplayName))")
        .eq("projId", projId);
    if (error || !data) return [];
    return data.map(t => ({
        taskId: t.taskId,
        name: t.taskName,
        description: t.taskDesc || "",
        dueDate: t.taskDueD ? t.taskDueD.split("T")[0] : "",
        dueTime: t.taskDueD ? t.taskDueD.split("T")[1]?.slice(0,5) : "",
        intensity: t.taskIntensity || "Light",
        priority: t.taskPrio || "Low",
        status: STAT_SLUG[t.statId] || "inactive",
        statId: t.statId || 1,
        assignees: (t.GROUPMEMBER || []).map(m => ({ grpmemId: m.grpmemId, userId: m.userId, name: m.USER?.userDisplayName || "Member" }))
    }));
};

const updateTaskStatus = async (taskId, slugStatus) => {
    await supa().from("TASK").update({ statId: STAT_ID[slugStatus] || 1 }).eq("taskId", taskId);
};

const loadGroupMembers = async () => {
    const grpId = getGrpId();
    if (!grpId) return [];
    const { data, error } = await supa().from("GROUPMEMBER").select("grpmemId, userId, USER(userDisplayName)").eq("grpId", grpId);
    if (error || !data) return [];
    return data.map(m => ({ grpmemId: m.grpmemId, userId: m.userId, name: m.USER?.userDisplayName || "Member" }));
};

const populateAssigneeCheckboxes = async (containerSelector, inputName, onChange) => {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const members = await loadGroupMembers();
    container.innerHTML = "";
    members.forEach(m => {
        const label = document.createElement("label");
        label.className = "assignee-option";
        label.innerHTML = `<input type="checkbox" name="${inputName}" value="${m.grpmemId}"><span>${m.name}</span>`;
        if (onChange) label.querySelector("input").addEventListener("change", onChange);
        container.appendChild(label);
    });
};

let verifyChoiceCallback = null;
let pauseFinishCallback  = null;
const openVerifyChoice     = (a,b) => { verifyChoiceCallback={onFinish:a,onRevise:b}; verifyChoiceOverlay?.classList.add("open"); verifyChoiceOverlay?.setAttribute("aria-hidden","false"); };
const closeVerifyChoice    = ()    => { verifyChoiceOverlay?.classList.remove("open"); verifyChoiceOverlay?.setAttribute("aria-hidden","true"); verifyChoiceCallback=null; };
const openPauseFinishChoice= (a,b) => { pauseFinishCallback={onPause:a,onFinish:b}; pauseFinishChoiceOverlay?.classList.add("open"); pauseFinishChoiceOverlay?.setAttribute("aria-hidden","false"); };
const closePauseFinishChoice=()    => { pauseFinishChoiceOverlay?.classList.remove("open"); pauseFinishChoiceOverlay?.setAttribute("aria-hidden","true"); pauseFinishCallback=null; };

if (verifyFinishBtn)       verifyFinishBtn.addEventListener("click",       () => { verifyChoiceCallback?.onFinish?.(); closeVerifyChoice(); });
if (verifyReviseBtn)       verifyReviseBtn.addEventListener("click",       () => { verifyChoiceCallback?.onRevise?.(); closeVerifyChoice(); });
if (verifyCloseBtn)        verifyCloseBtn.addEventListener("click",        closeVerifyChoice);
if (verifyChoiceOverlay)   verifyChoiceOverlay.addEventListener("click",   e => { if(e.target===verifyChoiceOverlay) closeVerifyChoice(); });
if (pauseFinishPauseBtn)   pauseFinishPauseBtn.addEventListener("click",   () => { pauseFinishCallback?.onPause?.(); closePauseFinishChoice(); });
if (pauseFinishFinishBtn)  pauseFinishFinishBtn.addEventListener("click",  () => { pauseFinishCallback?.onFinish?.(); closePauseFinishChoice(); });
if (pauseFinishCloseBtn)   pauseFinishCloseBtn.addEventListener("click",   closePauseFinishChoice);
if (pauseFinishChoiceOverlay) pauseFinishChoiceOverlay.addEventListener("click", e => { if(e.target===pauseFinishChoiceOverlay) closePauseFinishChoice(); });

const attachLeaderStatusBtn = (btn, task, isOwnTask) => {
    const setStatus = async (s) => { task.status=s; await updateTaskStatus(task.taskId,s); applyStatusToBtn(btn,s); };
    btn.addEventListener("click", async e => {
        e.stopPropagation();
        const cur = task.status || "inactive";
        if (isTerminal(cur)) return;
        if (isOwnTask) {
            if (cur==="inactive") await setStatus("active");
            else if (cur==="active") openPauseFinishChoice(()=>setStatus("pause"),()=>setStatus("finished"));
            else if (cur==="pause") await setStatus("active");
        } else {
            if (cur==="inactive") await setStatus("active");
            else if (cur==="active") await setStatus("missing");
            else if (cur==="verifying") openVerifyChoice(()=>setStatus("finished"),()=>setStatus("active"));
        }
    });
};

const formatTime12h = (t) => {
    if (!t) return "##:## AM";
    const [h,m]=t.split(":").map(Number); const ap=h>=12?"PM":"AM"; const h12=h%12||12;
    return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${ap}`;
};
const formatElapsedTime = (ms) => { const s=Math.floor((ms||0)/1000); return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`; };

const renderTask = async (task, idx, isOwnTask, target) => {
    if (!target) return;
    if (!isTerminal(task.status) && task.status!=="verifying" && isPastDue(task)) {
        task.status="missing"; await updateTaskStatus(task.taskId,"missing");
    }
    const assigneeNames = task.assignees.map(a=>a.name).join(", ")||"None";
    const status = task.status||"inactive";
    const priority=(task.priority||"Low").toLowerCase();
    const article = document.createElement("article");
    article.className="task-card task-card-clickable"; article.setAttribute("data-dynamic","true");
    if (priority==="high") article.style.backgroundColor="#FF8383";
    else if (priority==="medium") article.style.backgroundColor="#FFC193";
    article.innerHTML=`
        <div class="task-left">
            <h3>Task: ${task.name}</h3>
            <p>Assignee(s): <span class="assignee-info-wrap"><img class="assignee-info-icon" src="../../assets/Info.png" alt="Info"><span class="assignee-tooltip">${assigneeNames}</span></span> &nbsp; Due Date: ${formatTime12h(task.dueTime)} -- ${task.dueDate||"##/##/####"}</p>
        </div>
        <div class="task-actions">
            <button class="task-status ${status}" type="button">${STATUS_TEXT[status]||status}</button>
            <button class="more-btn" type="button" aria-label="More"><img src="../../assets/More.png" alt="More"></button>
        </div>`;
    const statusBtn=article.querySelector(".task-status");
    if(isTerminal(status)||status==="verifying") statusBtn.disabled=true;
    attachLeaderStatusBtn(statusBtn,task,isOwnTask);
    article.querySelector(".more-btn")?.addEventListener("click",e=>{e.stopPropagation();openTaskSettings(idx);});
    article.addEventListener("click",()=>openTaskDetails(idx));
    target.appendChild(article);
};

const renderAllTasks = async () => {
    const tasks=await loadTasks();
    const yl=document.querySelector("#yourTasksList"); const ol=document.querySelector("#otherTasksList");
    if(yl) yl.innerHTML=""; if(ol) ol.innerHTML="";
    let own=0,other=0,verify=0;
    for(let i=0;i<tasks.length;i++){
        const t=tasks[i]; const mine=t.assignees.some(a=>a.userId===currentUserId);
        await renderTask(t,i,mine,mine?yl:ol);
        if(mine) own++; else other++;
        if(t.status==="verifying") verify++;
    }
    if(yl&&own===0) yl.innerHTML=`<div class="empty-state"><img src="../../assets/Plus.png" class="empty-state-icon"><h3>No Tasks Assigned</h3><p>You have no personal tasks assigned to this project yet.</p></div>`;
    if(ol&&other===0) ol.innerHTML=`<div class="empty-state"><img src="../../assets/Plus.png" class="empty-state-icon"><h3>No Other Tasks</h3><p>There are no other tasks currently listed for this project.</p></div>`;
    const sc=document.querySelectorAll(".summary-card h3");
    if(sc[0]) sc[0].textContent=own; if(sc[1]) sc[1].textContent=other; if(sc[2]) sc[2].textContent=verify;
};

const closeTaskSettings=()=>{taskSettingsOverlay?.classList.remove("open");taskSettingsOverlay?.setAttribute("aria-hidden","true");};
const openTaskSettings=(i)=>{activeTaskIndex=i;taskSettingsOverlay?.classList.add("open");taskSettingsOverlay?.setAttribute("aria-hidden","false");};
const closeEditTaskInfo=()=>{editTaskInfoOverlay?.classList.remove("open");editTaskInfoOverlay?.setAttribute("aria-hidden","true");};
const closeManualStatus=()=>{manualStatusOverlay?.classList.remove("open");manualStatusOverlay?.setAttribute("aria-hidden","true");};
const openManualStatus=()=>{if(!manualStatusOverlay||activeTaskIndex===null)return;manualStatusOverlay.classList.add("open");manualStatusOverlay.setAttribute("aria-hidden","false");};
const closeRemoveTaskConfirm=()=>{removeTaskConfirmOverlay?.classList.remove("open");removeTaskConfirmOverlay?.setAttribute("aria-hidden","true");};
const openRemoveTaskConfirm=()=>{if(!removeTaskConfirmOverlay||activeTaskIndex===null)return;removeTaskConfirmOverlay.classList.add("open");removeTaskConfirmOverlay.setAttribute("aria-hidden","false");};
const closeTaskDetails=()=>{taskDetailsOverlay?.classList.remove("open");taskDetailsOverlay?.setAttribute("aria-hidden","true");};

const updateEditTaskSubmitState=()=>{
    if(!saveEditTaskInfoBtn)return;
    const ok=editTaskNameInput?.value.trim().length>0&&editDueDateInput?.value.length>0&&editDueTimeInput?.value.length>0&&document.querySelectorAll("input[name='editAssignees']:checked").length>0;
    saveEditTaskInfoBtn.disabled=!ok;
};

const openEditTaskInfo=async()=>{
    if(!editTaskInfoOverlay||activeTaskIndex===null)return;
    const tasks=await loadTasks(); const task=tasks[activeTaskIndex]; if(!task)return;
    if(editTaskNameInput) editTaskNameInput.value=task.name||"";
    if(editTaskDescriptionInput) editTaskDescriptionInput.value=task.description||"";
    if(editTaskResourcesInput) editTaskResourcesInput.value=task.resources||"";
    if(editDueDateInput){editDueDateInput.min=new Date().toISOString().split("T")[0];editDueDateInput.value=task.dueDate||"";}
    if(editDueTimeInput) editDueTimeInput.value=task.dueTime||"";
    const ei=document.getElementById("editIntensityInput"); if(ei) ei.value=task.intensity||"Light";
    const ep=document.getElementById("editPriorityInput"); if(ep) ep.value=task.priority||"Low";
    await populateAssigneeCheckboxes(".edit-assignee-options","editAssignees",updateEditTaskSubmitState);
    const ids=task.assignees.map(a=>String(a.grpmemId));
    document.querySelectorAll("input[name='editAssignees']").forEach(cb=>{cb.checked=ids.includes(cb.value);});
    updateEditTaskSubmitState();
    editTaskInfoOverlay.classList.add("open");editTaskInfoOverlay.setAttribute("aria-hidden","false");
};

const openTaskDetails=async(idx)=>{
    if(!taskDetailsOverlay)return;
    const tasks=await loadTasks(); const task=tasks[idx]; if(!task)return;
    if(detailTaskName) detailTaskName.textContent=task.name||"";
    if(detailTaskDescription) detailTaskDescription.textContent=task.description||"None";
    if(detailTaskResources) detailTaskResources.textContent=task.resources||"None";
    if(detailTaskAssignees) detailTaskAssignees.textContent=task.assignees.map(a=>a.name).join(", ")||"None";
    if(detailTaskDueDate) detailTaskDueDate.textContent=task.dueDate||"N/A";
    if(detailTaskDueTime) detailTaskDueTime.textContent=task.dueTime?formatTime12h(task.dueTime):"N/A";
    const di=document.getElementById("detailTaskIntensity"); if(di) di.textContent=task.intensity||"Light";
    const dp=document.getElementById("detailTaskPriority"); if(dp) dp.textContent=task.priority||"Low";
    if(detailTaskStatus){const s=task.status||"inactive";detailTaskStatus.textContent=STATUS_TEXT[s]||s;detailTaskStatus.className=`task-status ${s}`;detailTaskStatus.disabled=true;}
    if(detailTaskTimeActive) detailTaskTimeActive.textContent=formatElapsedTime(0);
    taskDetailsOverlay.classList.add("open");taskDetailsOverlay.setAttribute("aria-hidden","false");
};

if(topBackBtn) topBackBtn.addEventListener("click",()=>{window.location.href="../s.dashb.html";});
if(groupInfoTab) groupInfoTab.addEventListener("click",()=>{window.location.href="s.leadergrpviewing.html";});
if(backToCategoriesBtn) backToCategoriesBtn.addEventListener("click",()=>{window.location.href="s.leadercategory.html";});
if(discardTaskSettingsBtn) discardTaskSettingsBtn.addEventListener("click",closeTaskSettings);
if(taskSettingsOverlay) taskSettingsOverlay.addEventListener("click",e=>{if(e.target===taskSettingsOverlay)closeTaskSettings();});
if(openEditTaskInfoBtn) openEditTaskInfoBtn.addEventListener("click",()=>{closeTaskSettings();openEditTaskInfo();});
if(discardEditTaskInfoBtn) discardEditTaskInfoBtn.addEventListener("click",closeEditTaskInfo);
if(editTaskInfoOverlay) editTaskInfoOverlay.addEventListener("click",e=>{if(e.target===editTaskInfoOverlay)closeEditTaskInfo();});
if(openManualStatusBtn) openManualStatusBtn.addEventListener("click",()=>{closeTaskSettings();openManualStatus();});
if(discardManualStatusBtn) discardManualStatusBtn.addEventListener("click",closeManualStatus);
if(manualStatusOverlay) manualStatusOverlay.addEventListener("click",e=>{if(e.target===manualStatusOverlay)closeManualStatus();});
if(openRemoveTaskConfirmBtn) openRemoveTaskConfirmBtn.addEventListener("click",()=>{closeTaskSettings();openRemoveTaskConfirm();});
if(discardRemoveTaskBtn) discardRemoveTaskBtn.addEventListener("click",closeRemoveTaskConfirm);
if(removeTaskConfirmOverlay) removeTaskConfirmOverlay.addEventListener("click",e=>{if(e.target===removeTaskConfirmOverlay)closeRemoveTaskConfirm();});
if(closeTaskDetailsBtn) closeTaskDetailsBtn.addEventListener("click",closeTaskDetails);
if(taskDetailsOverlay) taskDetailsOverlay.addEventListener("click",e=>{if(e.target===taskDetailsOverlay)closeTaskDetails();});

if(confirmRemoveTaskBtn){
    confirmRemoveTaskBtn.addEventListener("click",async()=>{
        if(activeTaskIndex===null)return;
        const tasks=await loadTasks(); const taskId=tasks[activeTaskIndex]?.taskId;
        if(taskId){
            await supa().from("GROUPMEMBER").update({taskId:null}).eq("taskId",taskId);
            await supa().from("TASK").delete().eq("taskId",taskId);
        }
        activeTaskIndex=null; closeRemoveTaskConfirm(); await renderAllTasks();
    });
}

manualStatusButtons.forEach(btn=>{
    btn.addEventListener("click",async()=>{
        if(activeTaskIndex===null)return;
        const tasks=await loadTasks(); const task=tasks[activeTaskIndex]; if(!task)return;
        await updateTaskStatus(task.taskId,btn.dataset.manualStatus);
        closeManualStatus(); await renderAllTasks();
    });
});

const closePostTaskModal=()=>{postTaskModalOverlay?.classList.remove("open");postTaskModalOverlay?.setAttribute("aria-hidden","true");};
const updatePostTaskSubmitState=()=>{
    if(!postTaskSubmitBtn)return;
    const ok=taskNameInput?.value.trim().length>0&&dueDateInput?.value.length>0&&dueTimeInput?.value.length>0&&document.querySelectorAll("input[name='assignees']:checked").length>0;
    postTaskSubmitBtn.disabled=!ok;
};

if(openPostTaskModalBtn&&postTaskModalOverlay){
    openPostTaskModalBtn.addEventListener("click",async()=>{
        if(dueDateInput) dueDateInput.min=new Date().toISOString().split("T")[0];
        postTaskModalOverlay.classList.add("open");postTaskModalOverlay.setAttribute("aria-hidden","false");
        await populateAssigneeCheckboxes(".post-assignee-options","assignees",updatePostTaskSubmitState);
        updatePostTaskSubmitState();
    });
}
if(discardPostTaskBtn) discardPostTaskBtn.addEventListener("click",()=>{postTaskForm?.reset();updatePostTaskSubmitState();closePostTaskModal();});
if(taskNameInput) taskNameInput.addEventListener("input",updatePostTaskSubmitState);
if(dueDateInput)  dueDateInput.addEventListener("input",updatePostTaskSubmitState);
if(dueTimeInput)  dueTimeInput.addEventListener("input",updatePostTaskSubmitState);
if(postTaskModalOverlay) postTaskModalOverlay.addEventListener("click",e=>{if(e.target===postTaskModalOverlay)closePostTaskModal();});

if(postTaskForm){
    postTaskForm.addEventListener("submit",e=>{
        e.preventDefault();
        const checked=Array.from(postTaskForm.querySelectorAll("input[name='assignees']:checked"));
        if(!taskNameInput?.value.trim()||checked.length===0||!dueDateInput?.value||!dueTimeInput?.value)return;
        const name=taskNameInput.value.trim();
        showConfirmation(`Are you sure you want to post the task "${name}"?`,async()=>{
            const projId=getProjId();
            const dueISO=`${dueDateInput.value}T${dueTimeInput.value}:00`;
            const {data:newTask,error}=await supa().from("TASK").insert({
                taskName:name,
                taskDesc:taskDescriptionInput?.value.trim()||"",
                taskDueD:dueISO,
                taskIntensity:document.getElementById("intensityInput")?.value||"Light",
                taskPrio:document.getElementById("priorityInput")?.value||"Low",
                statId:STAT_ID.inactive,
                projId:projId?Number(projId):null
            }).select("taskId").single();
            if(error){alert("Failed to create task: "+error.message);return;}
            await Promise.all(checked.map(cb=>supa().from("GROUPMEMBER").update({taskId:newTask.taskId}).eq("grpmemId",Number(cb.value))));
            await renderAllTasks(); closePostTaskModal(); postTaskForm.reset(); updatePostTaskSubmitState();
        },{title:"Post Task",confirmText:"Post",cancelText:"Cancel"});
    });
}

if(editTaskInfoForm){
    editTaskInfoForm.addEventListener("submit",e=>{
        e.preventDefault();
        if(activeTaskIndex===null)return;
        const checked=Array.from(document.querySelectorAll("input[name='editAssignees']:checked"));
        if(!editTaskNameInput?.value.trim()||checked.length===0||!editDueDateInput?.value||!editDueTimeInput?.value)return;
        const name=editTaskNameInput.value.trim();
        showConfirmation(`Are you sure you want to save changes to task "${name}"?`,async()=>{
            const tasks=await loadTasks(); const task=tasks[activeTaskIndex]; if(!task)return;
            const dueISO=`${editDueDateInput.value}T${editDueTimeInput.value}:00`;
            const {error}=await supa().from("TASK").update({
                taskName:name,
                taskDesc:editTaskDescriptionInput?.value.trim()||"",
                taskDueD:dueISO,
                taskIntensity:document.getElementById("editIntensityInput")?.value||"Light",
                taskPrio:document.getElementById("editPriorityInput")?.value||"Low"
            }).eq("taskId",task.taskId);
            if(error){alert("Failed to update task: "+error.message);return;}
            await supa().from("GROUPMEMBER").update({taskId:null}).eq("taskId",task.taskId);
            await Promise.all(checked.map(cb=>supa().from("GROUPMEMBER").update({taskId:task.taskId}).eq("grpmemId",Number(cb.value))));
            closeEditTaskInfo(); await renderAllTasks();
        },{title:"Save Changes",confirmText:"Save",cancelText:"Cancel"});
    });
}

if(editTaskNameInput) editTaskNameInput.addEventListener("input",updateEditTaskSubmitState);
if(editDueDateInput)  editDueDateInput.addEventListener("input",updateEditTaskSubmitState);
if(editDueTimeInput)  editDueTimeInput.addEventListener("input",updateEditTaskSubmitState);

document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){closePostTaskModal();closeTaskSettings();closeEditTaskInfo();closeManualStatus();closeRemoveTaskConfirm();closeTaskDetails();}
});

const logoutBtn=document.querySelector(".logout");
if(logoutBtn) logoutBtn.addEventListener("click",()=>{showConfirmation("Are you sure you want to log out?",()=>{window.location.href="../../auth/log-sign.html";},{title:"Log Out",confirmText:"Log Out",cancelText:"Cancel"});});

(async()=>{
    const {data:{user}}=await supa().auth.getUser();
    currentUserId=user?.id||null;
    const projectName=sessionStorage.getItem("hive_selected_project_name");
    const el=document.querySelector(".project-name-display h2");
    if(projectName&&el) el.textContent=projectName;
    await renderAllTasks();
})();