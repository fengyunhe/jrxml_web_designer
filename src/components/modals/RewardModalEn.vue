<template>
  <BaseModal
    :visible="visible"
    :showHeader="false"
    :showFooter="false"
    @update:visible="$emit('update:visible', $event)"
    @cancel="closeModal"
    :contentClass="'reward-modal-content'"
    :useVShow="true"
  >
    <div class="reward-content">
      <h3>Your support keeps this project going!</h3>
      <img src="/src/assets/FIREGOD_CN.jpg" alt="Donation QR Code" class="reward-image">
      <p>Scan with WeChat to donate, thank you for your support!</p>
      
      <div class="paypal-section">
        <h4>Or donate with PayPal</h4>
        <div style="width:50%;margin:auto;" id="paypal-button-container-P-19G51974NJ968551RNFYXP3A"></div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue';
import { onMounted, ref } from 'vue';

// Define props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// Define emits
const emit = defineEmits(['update:visible']);

// PayPal SDK loaded flag
const paypalInitialized = ref(false);

// Close modal
const closeModal = () => {
  emit('update:visible', false);
};

// Load PayPal SDK and initialize buttons
const initPayPalButtons = () => {
  // Only initialize once
  if (paypalInitialized.value) {
    return;
  }
  
  // Load PayPal SDK
  const script = document.createElement('script');
  script.src = 'https://www.paypal.com/sdk/js?client-id=AVZB1IzcDRiJe7LZ-fScuoAUwJvN0nEwx1s845snzslzGK-1oOMiNS37Urw76p_xyeNhKhAPQp_BBVNu&vault=true&intent=subscription';
  script.setAttribute('data-sdk-integration-source', 'button-factory');
  script.onload = () => {
    if (window.paypal) {
      window.paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'silver',
          layout: 'horizontal',
          label: 'paypal'
        },
        createSubscription: function(data: any, actions: any) {
          return actions.subscription.create({
            /* Creates the subscription */
            plan_id: 'P-19G51974NJ968551RNFYXP3A'
          });
        },
        onApprove: function(data: any, actions: any) {
          alert(data.subscriptionID); // You can add optional success message for the subscriber here
        }
      }).render('#paypal-button-container-P-19G51974NJ968551RNFYXP3A');
      
      paypalInitialized.value = true;
    }
  };
  document.body.appendChild(script);
};

// Initialize PayPal buttons when component mounts
onMounted(() => {
  initPayPalButtons();
});

// Extend window interface to include paypal
declare global {
  interface Window {
    paypal: any;
  }
}
</script>

<style scoped>
/* Reward Modal Specific Styles */
.reward-modal-content {
  max-width: 400px;
  width: 90%;
}

:deep(.modal-body) {
  padding: 20px;
  text-align: center;
}

.reward-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}

.reward-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0 auto 20px;
  display: block;
}

.reward-content p {
  color: #666;
  margin: 0 0 20px;
}

.paypal-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.paypal-section h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
}

#paypal-button-container-P-19G51974NJ968551RNFYXP3A {
  margin: 0 auto;
}
</style>