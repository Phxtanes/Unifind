<template>
  <transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4 transition-all font-sans">
      <div class="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-w-6xl w-full flex flex-col max-h-[90vh] modal-card">
      
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 select-none">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <font-awesome :icon="['fas', 'briefcase']" class="text-lg" />
          </div>
          <div>
            <h2 class="text-base font-black text-slate-800 tracking-tight">{{ editItem ? $t('แก้ไขข้อมูลสิ่งของที่พบ') : $t('แจ้งสิ่งของที่พบ') }}</h2>
            <p class="text-slate-400 text-xs font-semibold mt-0.5">{{ $t('กรุณากรอกข้อมูลให้ครบถ้วนเพื่อความรวดเร็วในการติดตาม') }}</p>
          </div>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 rounded-full border border-slate-100 hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-700 transition duration-150">
          <font-awesome :icon="['fas', 'xmark']" class="text-sm" />
        </button>
      </div>
      
      <!-- Form -->
      <form @submit.prevent="submitForm" class="flex flex-col flex-1 min-h-0">
        <div class="p-8 overflow-y-auto flex-1 bg-slate-50/20">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Column 1: ข้อมูลสิ่งของ -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold">
                  <font-awesome :icon="['fas', 'box']" class="text-[11px]" />
                </div>
                <h3 class="text-xs font-extrabold text-blue-600 uppercase tracking-wider">{{ $t('ข้อมูลสิ่งของ') }}</h3>
              </div>

              <!-- ชื่อสิ่งของ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('ชื่อสิ่งของ') }} <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.item_name" type="text" required :placeholder="$t('เช่น กระเป๋าสตางค์, iPad Pro')" 
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'tag']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- หมวดหมู่สิ่งของ -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-xs font-bold text-slate-650">{{ $t('หมวดหมู่สิ่งของ') }} <span class="text-red-500">*</span></label>
                  <button type="button" @click="showAddCategory = true" class="text-[10px] font-extrabold text-indigo-655 hover:text-indigo-850 transition flex items-center gap-1">
                    <font-awesome :icon="['fas', 'plus']" class="text-[9px]" /> {{ $t('เพิ่มประเภท') }}
                  </button>
                </div>
                <div class="relative">
                  <select v-model="form.category_id" required class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                    <option value="" disabled>{{ $t('เลือกประเภทหมวดหมู่') }}</option>
                    <option v-for="cat in itemsStore.categories" :key="cat.category_id" :value="cat.category_id">
                      {{ cat.category_name }}
                    </option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                  </div>
                </div>
              </div>

              <!-- สถานที่พบ -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-xs font-bold text-slate-650">{{ $t('สถานที่พบ') }} <span class="text-red-500">*</span></label>
                  <button type="button" @click="showAddLocation = true" class="text-[10px] font-extrabold text-indigo-655 hover:text-indigo-850 transition flex items-center gap-1">
                    <font-awesome :icon="['fas', 'plus']" class="text-[9px]" /> {{ $t('เพิ่มสถานที่') }}
                  </button>
                </div>
                <div class="relative">
                  <select v-model="form.location_id" required class="w-full pl-4 pr-12 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                    <option value="" disabled>{{ $t('เลือกสถานที่พบ') }}</option>
                    <option v-for="loc in itemsStore.locations" :key="loc.location_id" :value="loc.location_id">
                      {{ loc.location_name }}
                    </option>
                    <option value="custom">{{ $t('อื่นๆ (ระบุเอง)') }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 gap-1.5">
                    <font-awesome :icon="['fas', 'location-dot']" class="text-xs" />
                    <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                  </div>
                </div>
              </div>

              <!-- ระบุสถานที่เอง -->
              <transition name="fade">
                <div v-if="form.location_id === 'custom'" class="mt-3">
                  <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('ระบุสถานที่พบเอง') }} <span class="text-red-500">*</span></label>
                  <div class="relative">
                    <input v-model="customLocationName" type="text" required :placeholder="$t('ระบุสถานที่ เช่น อาคารเรียน 3 ห้อง 302')"
                      class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                      <font-awesome :icon="['fas', 'location-dot']" class="text-xs" />
                    </div>
                  </div>
                </div>
              </transition>

              <!-- วันและเวลาที่พบ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('วันและเวลาที่พบ') }} <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.found_date" type="datetime-local" required
                    @click="showDateTimePicker"
                    @focus="showDateTimePicker"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'calendar-days']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- รายละเอียดเพิ่มเติม -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('รายละเอียดเพิ่มเติม') }}</label>
                <textarea v-model="form.description" rows="3" :placeholder="$t('ระบุตำหนิ สี สติกเกอร์ หรือจุดสังเกตเฉพาะ...')"
                  class="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition resize-none"></textarea>
              </div>
            </div>

            <!-- Column 2: ข้อมูลผู้พบส่ง -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold">
                  <font-awesome :icon="['fas', 'user']" class="text-[11px]" />
                </div>
                <h3 class="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">{{ $t('ข้อมูลผู้พบส่ง') }}</h3>
              </div>

              <!-- ชื่อผู้พบส่ง -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('ชื่อผู้พบส่ง') }} <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.finder_name" type="text" required :placeholder="$t('เช่น นายสมชาย ดีใจ')"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'user']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- ประเภทสถานะผู้พบ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('ประเภทสถานะผู้พบ') }} <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select v-model="form.finder_type" required class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                    <option value="STUDENT">{{ $t('นักศึกษา') }}</option>
                    <option value="STAFF">{{ $t('พนักงาน / อาจารย์') }}</option>
                    <option value="MAID">{{ $t('แม่บ้าน') }}</option>
                    <option value="SECURITY">{{ $t('เจ้าหน้าที่รักษาความปลอดภัย') }}</option>
                    <option value="EXTERNAL">{{ $t('บุคคลภายนอก') }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                  </div>
                </div>
              </div>

              <!-- เบอร์โทรศัพท์ติดต่อ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('เบอร์โทรศัพท์ติดต่อ') }} <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="form.finder_phoneNumber" type="tel" required :placeholder="$t('เช่น 081-234-5678')" maxlength="10"
                    class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                    <font-awesome :icon="['fas', 'phone']" class="text-xs" />
                  </div>
                </div>
              </div>

              <!-- แสดงเพิ่มเมื่อเป็น "นักศึกษา" -->
              <transition name="fade">
                <div v-if="form.finder_type === 'STUDENT'" class="space-y-4">
                  <!-- เลขทะเบียนนักศึกษา -->
                  <div>
                    <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('เลขทะเบียนนักศึกษา') }} <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="form.finder_studentId" type="text" :required="form.finder_type === 'STUDENT'" :placeholder="$t('เช่น 64010123456')"
                        class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                        <font-awesome :icon="['fas', 'id-card']" class="text-xs" />
                      </div>
                    </div>
                  </div>

                  <!-- อีเมลมหาวิทยาลัย -->
                  <div>
                    <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('อีเมลมหาวิทยาลัย') }} <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="form.finder_universityEmail" type="email" :required="form.finder_type === 'STUDENT'" :placeholder="$t('เช่น student@university.ac.th')"
                        class="w-full pl-4 pr-10 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold transition" />
                      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                        <font-awesome :icon="['fas', 'envelope']" class="text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <!-- Column 3: ข้อมูลการจัดเก็บ -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 mb-4">
                <div class="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold">
                  <font-awesome :icon="['fas', 'database']" class="text-[11px]" />
                </div>
                <h3 class="text-xs font-extrabold text-blue-600 uppercase tracking-wider">{{ $t('ข้อมูลการจัดเก็บ') }}</h3>
              </div>

              <!-- รูปภาพสิ่งของ -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">{{ $t('รูปภาพสิ่งของ') }} <span class="text-red-500">*</span></label>
                
                <!-- Drag and Drop Zone -->
                <div class="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center text-center cursor-pointer relative group"
                     @dragover.prevent
                     @drop.prevent="handleDrop"
                     @click="triggerFileInput">
                  <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleCreateFileUpload" />
                  
                  <div v-if="!previewUrl" class="flex flex-col items-center">
                    <div class="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition duration-200">
                      <font-awesome :icon="['fas', 'cloud-arrow-up']" class="text-lg" />
                    </div>
                    <span class="text-xs font-extrabold text-slate-700">{{ $t('คลิกหรือลากไฟล์มาวางที่นี่') }}</span>
                    <span class="text-[9px] text-slate-400 mt-1">{{ $t('รองรับไฟล์ JPG, JPEG, PNG (ขนาดไม่เกิน 10MB)') }}</span>
                    <button type="button" class="mt-4 px-4 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-indigo-650 bg-white hover:bg-indigo-50/30 shadow-sm transition flex items-center gap-1.5">
                      <font-awesome :icon="['fas', 'file-image']" class="text-[10px] text-indigo-400" /> {{ $t('เลือกไฟล์') }}
                    </button>
                  </div>
                  <div v-else class="w-full flex flex-col items-center">
                    <div class="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black/5 flex items-center justify-center">
                      <img :src="previewUrl" class="max-h-full max-w-full object-contain" />
                      <button type="button" @click.stop="removeImage" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center text-xs transition">
                        &times;
                      </button>
                    </div>
                    <span class="text-[10px] text-slate-500 mt-2 font-semibold truncate max-w-[200px]">{{ imageFile?.name }}</span>
                  </div>
                </div>
              </div>

              <!-- ตู้ล็อกเกอร์ที่จัดเก็บ (12 ตู้ตามเดือน × 2 ชั้น) -->
              <div>
                <label class="block text-xs font-bold text-slate-650 mb-1.5">
                  {{ $t('ตู้ล็อกเกอร์ที่จัดเก็บ') }}
                  <span class="text-[10px] text-slate-400 font-normal ml-1">{{ $t('(เดือนจากวันที่พบจะถูกเลือกอัตโนมัติ)') }}</span>
                </label>

                <div class="grid grid-cols-2 gap-2 mb-2">
                  <!-- Dropdown ตู้ (L01–L12) -->
                  <div class="relative">
                    <select v-model="form.locker_number"
                      class="w-full pl-3 pr-8 py-2.5 bg-slate-50/50 hover:bg-slate-50/85 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none text-xs text-slate-700 font-semibold appearance-none transition">
                      <option value="">{{ $t('ไม่ระบุตู้') }}</option>
                      <option v-for="locker in allLockers" :key="locker.num" :value="locker.num">{{ locker.name }}</option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                      <font-awesome :icon="['fas', 'chevron-down']" class="text-[10px]" />
                    </div>
                  </div>

                  <!-- Toggle ชั้น 01 / 02 -->
                  <div class="flex gap-2">
                    <button type="button" @click="form.locker_floor = '01'"
                      :class="form.locker_floor === '01' ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                      class="flex-1 py-2.5 text-[11px] font-bold rounded-xl border text-center transition">
                      {{ langStore.locale === 'th' ? 'ชั้น 01' : 'Floor 01' }}
                    </button>
                    <button type="button" @click="form.locker_floor = '02'"
                      :class="form.locker_floor === '02' ? 'bg-indigo-600 text-white border-transparent shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'"
                      class="flex-1 py-2.5 text-[11px] font-bold rounded-xl border text-center transition">
                      {{ langStore.locale === 'th' ? 'ชั้น 02' : 'Floor 02' }}
                    </button>
                  </div>
                </div>

                <!-- Preview รหัสตู้ที่จะบันทึก -->
                <div class="flex items-center gap-2 min-h-[22px]">
                  <template v-if="form.locker_number">
                    <span class="text-[10px] text-slate-455 font-medium">{{ $t('รหัสตู้ที่จะบันทึก:') }}</span>
                    <span class="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                      L{{ form.locker_number }}{{ form.locker_floor }}
                    </span>
                  </template>
                  <span v-else class="text-[10px] text-slate-350 italic">{{ $t('ไม่ระบุตู้ล็อกเกอร์') }}</span>
                </div>
              </div>

              <!-- ข้อมูลความเป็นส่วนตัว -->
              <div class="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-700 mt-4 shadow-sm shadow-blue-100/10">
                <font-awesome :icon="['fas', 'circle-info']" class="text-base text-blue-500 shrink-0 mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <h4 class="text-[11px] font-bold text-blue-800">{{ $t('ข้อมูลของคุณจะถูกเก็บเป็นความลับ') }}</h4>
                  <p class="text-[10px] text-blue-650 leading-relaxed font-semibold">{{ $t('ข้อมูลทั้งหมดจะถูกนำไปใช้เพื่อการติดตามสิ่งของเท่านั้น และจะไม่เปิดเผยต่อบุคคลภายนอก') }}</p>
                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
          <button type="button" @click="$emit('close')" 
            class="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 text-xs transition duration-150">
            {{ $t('ยกเลิก') }}
          </button>
          <button type="submit" :disabled="isSubmitting" 
            class="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/10">
            <span v-if="isSubmitting" class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
            <font-awesome v-else :icon="['fas', 'paper-plane']" class="text-[10px]" />
            {{ isSubmitting ? $t('กำลังบันทึกข้อมูล...') : (editItem ? $t('บันทึกการแก้ไข') : $t('บันทึกข้อมูล')) }}
          </button>
        </div>
      </form>
    </div>
  </div>
  </transition>

  <!-- Add Category Modal -->
  <AddCategoryModal :show="showAddCategory" @close="showAddCategory = false" @success="onCategoryAdded" />

  <!-- Add Location Modal -->
  <AddLocationModal :show="showAddLocation" @close="showAddLocation = false" @success="onLocationAdded" />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'
import { useItemsStore } from '~/stores/items'
import AddCategoryModal from './AddCategoryModal.vue'
import AddLocationModal from './AddLocationModal.vue'
import { useLangStore } from '~/stores/lang'

const langStore = useLangStore()
const showAddCategory = ref(false)
const showAddLocation = ref(false)

const onCategoryAdded = (newCat) => {
  showAddCategory.value = false
  if (newCat && newCat.category_id) {
    form.value.category_id = newCat.category_id
  }
}

const onLocationAdded = (newLoc) => {
  showAddLocation.value = false
  if (newLoc && newLoc.location_id) {
    form.value.location_id = newLoc.location_id
  }
}

const props = defineProps({
  show: Boolean,
  isSubmitting: Boolean,
  username: {
    type: String,
    default: 'Staff'
  },
  editItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'submit'])

const itemsStore = useItemsStore()

const showDateTimePicker = (event) => {
  const target = event.target
  if (target && typeof target.showPicker === 'function') {
    target.showPicker()
  }
}

const lockerMonths = [
  { num: '01', name: 'มกราคม' },
  { num: '02', name: 'กุมภาพันธ์' },
  { num: '03', name: 'มีนาคม' },
  { num: '04', name: 'เมษายน' },
  { num: '05', name: 'พฤษภาคม' },
  { num: '06', name: 'มิถุนายน' },
  { num: '07', name: 'กรกฎาคม' },
  { num: '08', name: 'สิงหาคม' },
  { num: '09', name: 'กันยายน' },
  { num: '10', name: 'ตุลาคม' },
  { num: '11', name: 'พฤศจิกายน' },
  { num: '12', name: 'ธันวาคม' }
]

const customLockers = ref([])

const loadCustomLockers = () => {
  if (process.client) {
    const saved = localStorage.getItem('unifind_custom_lockers')
    if (saved) {
      try {
        customLockers.value = JSON.parse(saved)
      } catch (e) {
        console.error(e)
      }
    }
  }
}

const allLockers = computed(() => {
  const standard = lockerMonths.map(m => ({ num: m.num, name: `L${m.num} – ${m.name}` }))
  const custom = customLockers.value.map(cl => {
    const rawNum = cl.lockerId.replace('L', '')
    return { num: rawNum, name: `${cl.lockerId} – ${cl.label || 'ตู้เพิ่มเติม'}` }
  })
  return [...standard, ...custom]
})

const form = ref({
  item_name: '',
  category_id: '',
  location_id: '',
  found_date: '',
  description: '',
  status: 'STORED',
  locker_number: '',  // '01'–'12' (เดือน)
  locker_floor: '01', // '01' หรือ '02'
  finder_name: '',
  finder_type: 'STAFF',
  finder_phoneNumber: '',
  finder_studentId: '',
  finder_universityEmail: ''
})

const imageFile = ref(null)
const previewUrl = ref('')
const fileInput = ref(null)
const customLocationName = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadCustomLockers()
    // Ensure master data is fetched from the database
    if (itemsStore.categories.length === 0 || itemsStore.locations.length === 0) {
      itemsStore.fetchMasterData()
    }
    if (props.editItem) {
      // Parse locker_id เช่น 'L0102' → locker_number='01', locker_floor='02'
      let lockerNum = ''
      let lockerFloor = '01'
      const existingLockerId = props.editItem.locker_id || ''
      const lockerMatch = existingLockerId.match(/^L(\d+)(\d{2})$/)
      if (lockerMatch) {
        lockerNum = lockerMatch[1]
        lockerFloor = lockerMatch[2]
      }
      form.value = {
        item_name: props.editItem.name || '',
        category_id: props.editItem.category_id || '',
        location_id: props.editItem.location_id || '',
        found_date: dayjs(props.editItem.date).format('YYYY-MM-DDTHH:mm'),
        description: props.editItem.description || '',
        status: props.editItem.status ? props.editItem.status.toUpperCase() : 'STORED',
        locker_number: lockerNum,
        locker_floor: lockerFloor,
        finder_name: props.editItem.finderName || '',
        finder_type: props.editItem.finderType || 'STAFF',
        finder_phoneNumber: props.editItem.finderPhone || '',
        finder_studentId: props.editItem.finderStudentId || '',
        finder_universityEmail: props.editItem.finderEmail || ''
      }
      previewUrl.value = props.editItem.image_url || ''
      imageFile.value = null
      customLocationName.value = ''
    } else {
      form.value = {
        item_name: '',
        category_id: '',
        location_id: '',
        found_date: dayjs().format('YYYY-MM-DDTHH:mm'),
        description: '',
        status: 'STORED',
        locker_number: dayjs().format('MM'), // auto-select เดือนปัจจุบัน
        locker_floor: '01',
        finder_name: '',
        finder_type: 'STAFF',
        finder_phoneNumber: '',
        finder_studentId: '',
        finder_universityEmail: ''
      }
      imageFile.value = null
      previewUrl.value = ''
      customLocationName.value = ''
    }
  }
})

// เมื่อวันที่พบเปลี่ยน ให้ auto-select ตู้ตามเดือน (เฉพาะโหมดสร้างใหม่)
watch(() => form.value.found_date, (newDate) => {
  if (newDate && !props.editItem) {
    form.value.locker_number = dayjs(newDate).format('MM')
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleCreateFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const handleDrop = (event) => {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    imageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const removeImage = () => {
  imageFile.value = null
  previewUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const submitForm = async () => {
  if (!props.editItem && !imageFile.value) {
    alert('กรุณาอัปโหลดรูปภาพสิ่งของ')
    return
  }

  let finalLocationId = form.value.location_id
  if (finalLocationId === 'custom') {
    if (!customLocationName.value.trim()) {
      alert('กรุณากรอกสถานที่พบ')
      return
    }
    try {
      const newLoc = await itemsStore.createLocation(customLocationName.value.trim())
      finalLocationId = newLoc.location_id || newLoc.id
    } catch (error) {
      console.error('Failed to create location:', error)
      alert('เกิดข้อผิดพลาดในการบันทึกสถานที่ใหม่')
      return
    }
  }

  // สร้าง locker_id จาก locker_number + locker_floor เช่น '07' + '02' → 'L0702'
  const computedLockerId = form.value.locker_number
    ? `L${form.value.locker_number}${form.value.locker_floor}`
    : null

  const itemData = {
    item_name: form.value.item_name,
    category_id: parseInt(form.value.category_id),
    location_id: parseInt(finalLocationId),
    found_date: form.value.found_date,
    description: form.value.description,
    status: form.value.status,
    locker_id: computedLockerId
  }

  const finderData = {
    person_type: form.value.finder_type,
    full_name: form.value.finder_name,
    student_id: (form.value.finder_type === 'STUDENT' || form.value.finder_type === 'STAFF') ? form.value.finder_studentId : null,
    email: (form.value.finder_type === 'STUDENT' || form.value.finder_type === 'STAFF') ? form.value.finder_universityEmail : null,
    phone: form.value.finder_phoneNumber
  }

  emit('submit', { itemData, finderData }, imageFile.value)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: translateY(20px) scale(0.97);
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
